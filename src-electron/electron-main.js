import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron'
import { initialize, enable } from '@electron/remote/main'

import path from 'path'
import os from 'os'

initialize();

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

try {
  if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
  }
}
catch (_) { }

let mainWindow

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 1280,
    height: 960,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools()
  }
  else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  enable(mainWindow.webContents);
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// IPC Handlers TEST

// ipcMain.on('send', (event, args) => {
//   console.log(args)
// })


// // ipcMain.handle('getSomeInfo', (event, message) => {
// // 	// Создаёт диалог и отправляет результат в preload.js
// // 	return dialog.showMessageBox({message})
// // })

// // ipcMain.handle('getSomeInfo', async (event, message) => {
// // 	// Создаёт диалог и отправляет результат в preload.js
// // 	// return dialog.showMessageBox({message})
// //   return 1
// // })

// ipcMain.handle('getSomeInfo', async (event, ...args) => {
//   // const result = await somePromise(...args)
//   return 2
// })

