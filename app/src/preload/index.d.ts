import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    file: {
      saveDialog: (args: { content: string; defaultFilename?: string }) => Promise<{
        success: boolean
        path?: string
        error?: string
        canceled?: boolean
      }>
    }
  }
}
