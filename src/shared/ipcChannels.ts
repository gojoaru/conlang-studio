import type { ConlangProject } from './types/conlang'

export const IPC_CHANNELS = {
  SAVE_PROJECT: 'project:save',
  OPEN_PROJECT: 'project:open',
  EXPORT_FONT: 'font:export'
} as const

export interface SaveProjectResult {
  canceled: boolean
  filePath?: string
}

export interface OpenProjectResult {
  canceled: boolean
  filePath?: string
  project?: ConlangProject
}

export interface ConlangDesktopAPI {
  saveProject: (project: ConlangProject, currentPath?: string) => Promise<SaveProjectResult>
  openProject: () => Promise<OpenProjectResult>
  exportFont: (fontName: string, buffer: ArrayBuffer) => Promise<SaveProjectResult>
}
