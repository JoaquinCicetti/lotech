import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const serial = {
  list: () => ipcRenderer.invoke('serial:list'),
  open: (opts: { path: string; baudRate: number }) => ipcRenderer.invoke('serial:open', opts),
  write: (args: { path: string; data: string | Uint8Array }) =>
    ipcRenderer.invoke('serial:write', args),
  close: (path: string) => ipcRenderer.invoke('serial:close', path),
  onData: (cb: (payload: { path: string; line: string }) => void) =>
    ipcRenderer.on('serial:data', (_e, payload) => cb(payload)),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('serial', serial)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI

  // @ts-ignore (define in dts)
  window.serial = serial
}
