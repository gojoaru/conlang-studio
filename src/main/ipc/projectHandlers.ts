import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { IPC_CHANNELS } from '@shared/ipcChannels'
import type { ConlangProject } from '@shared/types/conlang'

export function registerProjectHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.SAVE_PROJECT,
    async (event, project: ConlangProject, currentPath?: string) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      let targetPath = currentPath

      if (!targetPath) {
        const { canceled, filePath } = await dialog.showSaveDialog(win!, {
          title: 'Save Conlang Project',
          defaultPath: `${project.meta.name || 'untitled'}.conlang`,
          filters: [{ name: 'Conlang Studio Project', extensions: ['conlang', 'json'] }]
        })
        if (canceled || !filePath) return { canceled: true }
        targetPath = filePath
      }

      const payload: ConlangProject = {
        ...project,
        meta: { ...project.meta, updatedAt: new Date().toISOString() }
      }

      await writeFile(targetPath, JSON.stringify(payload, null, 2), 'utf-8')
      return { canceled: false, filePath: targetPath }
    }
  )

  ipcMain.handle(IPC_CHANNELS.OPEN_PROJECT, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
      title: 'Open Conlang Project',
      properties: ['openFile'],
      filters: [{ name: 'Conlang Studio Project', extensions: ['conlang', 'json'] }]
    })

    if (canceled || filePaths.length === 0) return { canceled: true }

    const raw = await readFile(filePaths[0], 'utf-8')
    const project = JSON.parse(raw) as ConlangProject
    return { canceled: false, filePath: filePaths[0], project }
  })

  ipcMain.handle(IPC_CHANNELS.EXPORT_FONT, async (event, fontName: string, buffer: ArrayBuffer) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { canceled, filePath } = await dialog.showSaveDialog(win!, {
      title: 'Export Compiled Font',
      defaultPath: `${fontName || 'conscript'}.ttf`,
      filters: [{ name: 'TrueType Font', extensions: ['ttf'] }]
    })

    if (canceled || !filePath) return { canceled: true }

    await writeFile(filePath, Buffer.from(buffer))
    return { canceled: false, filePath }
  })
}
