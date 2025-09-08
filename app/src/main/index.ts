import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { SerialPort } from 'serialport'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    fullscreen: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  const ports: Record<string, SerialPort> = {}
  const messageBuffers: Record<string, string> = {}
  ipcMain.handle('serial:list', async () => SerialPort.list())

  ipcMain.handle('serial:open', (_e, { path, baudRate }) => {
    const port = new SerialPort({ path, baudRate, lock: false })
    messageBuffers[path] = ''

    console.log('Opening serial port:', path, 'at', baudRate, 'baud')

    port.on('error', (err) => {
      console.error('Serial port error:', err)
      if (mainWindow) {
        mainWindow.webContents.send('serial:error', { path, error: err.message })
      }
    })

    port.on('open', () => {
      console.log('Serial port opened successfully')
    })

    // Handle raw data instead of using ReadlineParser
    port.on('data', (data: Buffer) => {
      if (!mainWindow) {
        console.error('win is null')
        return
      }

      // Append to buffer
      messageBuffers[path] += data.toString()

      // Process complete messages
      const lines = messageBuffers[path].split('\n')
      messageBuffers[path] = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine) {
          console.log('Serial data received:', trimmedLine)
          mainWindow.webContents.send('serial:data', { path, line: trimmedLine })
        }
      }

      // Prevent buffer overflow - clear if too large
      if (messageBuffers[path].length > 10000) {
        console.warn('Clearing oversized message buffer')
        messageBuffers[path] = ''
      }
    })

    ports[path] = port
    return true
  })

  ipcMain.handle('serial:write', (_e, { path, data }) => {
    const p = ports[path]
    if (!p) throw new Error('Port not open')

    console.log('writing', data)
    p.write(data + '\n')
    return true
  })

  ipcMain.handle('serial:close', (_e, path) => {
    const p = ports[path]
    if (p) {
      p.close()
      delete ports[path]
      delete messageBuffers[path]
    }
    return true
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
