import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, type ConlangDesktopAPI } from '@shared/ipcChannels'

const api: ConlangDesktopAPI = {
  saveProject: (project, currentPath) =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_PROJECT, project, currentPath),
  openProject: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_PROJECT),
  exportFont: (fontName, buffer) => ipcRenderer.invoke(IPC_CHANNELS.EXPORT_FONT, fontName, buffer)
}

contextBridge.exposeInMainWorld('conlangAPI', api)
