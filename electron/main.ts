import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'

const isDev = !!process.env.VITE_DEV_SERVER_URL

let mainWindow: BrowserWindow | null = null
let closeInProgress = false

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    createMenu()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 680,
    minHeight: 400,
    frame: false,
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin'
      ? { trafficLightPosition: { x: -100, y: -100 }, vibrancy: 'under-window', backgroundColor: undefined }
      : { backgroundColor: '#f5f5f7' }),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    if (!closeInProgress) {
      closeInProgress = true
      e.preventDefault()
      mainWindow?.webContents.send('before-close')
    }
  })

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('maximize-change', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('maximize-change', false)
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-action', 'new'),
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu-action', 'open'),
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-action', 'save'),
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu-action', 'save-as'),
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => mainWindow?.webContents.send('menu-action', 'exit'),
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        {
          label: '撤销',
          accelerator: 'CmdOrCtrl+Z',
          click: () => mainWindow?.webContents.send('menu-action', 'undo'),
        },
        {
          label: '重做',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: () => mainWindow?.webContents.send('menu-action', 'redo'),
        },
        { type: 'separator' },
        {
          label: '剪切',
          accelerator: 'CmdOrCtrl+X',
          click: () => mainWindow?.webContents.send('menu-action', 'cut'),
        },
        {
          label: '复制',
          accelerator: 'CmdOrCtrl+C',
          click: () => mainWindow?.webContents.send('menu-action', 'copy'),
        },
        {
          label: '粘贴',
          accelerator: 'CmdOrCtrl+V',
          click: () => mainWindow?.webContents.send('menu-action', 'paste'),
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '深色模式切换',
          click: () => mainWindow?.webContents.send('toggle-dark-mode'),
        },
      ],
    },
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    })
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

ipcMain.handle('openFolderDialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
  if (result.canceled) return null
  const folderPath = result.filePaths[0]
  const entries = readDirEntries(folderPath)
  return { folderPath, entries }
})

function readDirEntries(dirPath: string): Array<{ name: string; path: string; isDirectory: boolean }> {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return entries
      .filter(e => e.isDirectory() || e.name.endsWith('.md') || e.name.endsWith('.markdown'))
      .map(e => ({
        name: e.name,
        path: path.join(dirPath, e.name),
        isDirectory: e.isDirectory(),
      }))
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
  } catch {
    return []
  }
}

ipcMain.handle('readDirectory', async (_event, dirPath: string) => {
  return readDirEntries(dirPath)
})

ipcMain.handle('readDirectoryRecursive', async (_event, dirPath: string) => {
  const result: Array<{ name: string; path: string; isDirectory: boolean; preview?: string }> = []
  function walk(dir: string) {
    const entries = readDirEntries(dir)
    for (const e of entries) {
      result.push(e)
      if (e.isDirectory) {
        walk(e.path)
      } else if (/\.(md|markdown)$/i.test(e.name)) {
        try {
          const content = fs.readFileSync(e.path, 'utf-8').slice(0, 500)
          result[result.length - 1].preview = content
        } catch {}
      }
    }
  }
  walk(dirPath)
  return result
})

ipcMain.handle('openFileDialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  })
  if (result.canceled) return null
  const content = fs.readFileSync(result.filePaths[0], 'utf-8')
  return { content, filePath: result.filePaths[0] }
})

ipcMain.handle('saveFileDialog', async (_event, defaultName?: string) => {
  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  })
  if (result.canceled) return null
  return result.filePath
})

ipcMain.handle('readFile', async (_event, filePath: string) => {
  return fs.readFileSync(filePath, 'utf-8')
})

ipcMain.handle('writeFile', async (_event, { filePath, content }: { filePath: string; content: string }) => {
  fs.writeFileSync(filePath, content, 'utf-8')
})

ipcMain.handle('makeDirectory', async (_event, dirPath: string) => {
  fs.mkdirSync(dirPath, { recursive: true })
})

ipcMain.handle('showUnsavedDialog', async () => {
  const result = await dialog.showMessageBox({
    type: 'question',
    buttons: ['保存', '不保存', '取消'],
    defaultId: 0,
    cancelId: 2,
    message: '是否保存更改？',
    detail: '如果不保存，更改将会丢失。',
  })
  if (result.response === 0) return 'save'
  if (result.response === 1) return 'discard'
  return 'cancel'
})

ipcMain.handle('quitApp', () => {
  app.quit()
})

ipcMain.on('close-confirmed', () => {
  closeInProgress = false
  mainWindow?.destroy()
})

ipcMain.handle('windowMinimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('windowMaximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('windowClose', () => {
  mainWindow?.close()
})

ipcMain.handle('windowIsMaximized', () => {
  return mainWindow?.isMaximized() ?? false
})
