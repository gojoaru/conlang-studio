import type { ConlangDesktopAPI } from '@shared/ipcChannels'

declare global {
  interface Window {
    conlangAPI: ConlangDesktopAPI
  }
}
