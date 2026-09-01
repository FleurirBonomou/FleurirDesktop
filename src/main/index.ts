import { app, shell, BrowserWindow, ipcMain, protocol } from 'electron'
import { join, extname } from 'path'
import { promises as fs } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'
import { startServer, stopServer } from './server'
import icon from '../../resources/icon.png?asset'

app.disableHardwareAcceleration()

// Protocole fleuri-file:// : expose des fichiers locaux au renderer (images
// de contenu). En dev la fenêtre est chargée depuis http://localhost, et
// Chromium bloque file://  depuis une origine http. Enregistré comme scheme
// privilégié et servi en lisant le fichier avec fs (jamais de file:// brut).
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'fleuri-file',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
])

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif'
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
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
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.fleurir.app')

  // Sert les fichiers locaux via fleuri-file:///path/to/file (lecture seule).
  protocol.handle('fleuri-file', async (request) => {
    const raw = new URL(request.url)
    const decoded = raw.searchParams.get('path') ?? decodeURIComponent(raw.pathname)
    console.log('[fleuri-file] requête:', request.url, '→ chemin:', decoded)
    try {
      const data = await fs.readFile(decoded)
      const mime = MIME_BY_EXT[extname(decoded).toLowerCase()] ?? 'application/octet-stream'
      return new Response(data, { headers: { 'Content-Type': mime } })
    } catch (err) {
      console.error('[fleuri-file] échec lecture de', decoded, err)
      return new Response('Not found', {
        status: 404,
        headers: { 'x-fleuri-file': 'read-failed' }
      })
    }
  })

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Fleurir
  registerIpcHandlers()

  // Le serveur Fleurir est lancé avec l'app (ou déjà en cours d'exécution) :
  // on attend qu'il réponde avant d'ouvrir la fenêtre, pour que les premiers
  // appels réseau du renderer trouvent l'API.
  await startServer()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Tue le serveur lancé par l'app quand l'application se ferme.
app.on('will-quit', () => {
  stopServer()
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
