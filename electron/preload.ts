import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFolderDialog: (): Promise<{ folderPath: string; entries: Array<{ name: string; path: string; isDirectory: boolean }> } | null> =>
    ipcRenderer.invoke('openFolderDialog'),
  readDirectory: (dirPath: string): Promise<Array<{ name: string; path: string; isDirectory: boolean }>> =>
    ipcRenderer.invoke('readDirectory', dirPath),

  readDirectoryRecursive: (dirPath: string): Promise<Array<{ name: string; path: string; isDirectory: boolean }>> =>
    ipcRenderer.invoke('readDirectoryRecursive', dirPath),

  openFileDialog: (): Promise<{ content: string; filePath: string } | null> =>
    ipcRenderer.invoke('openFileDialog'),

  saveFileDialog: (defaultName?: string): Promise<string | null> =>
    ipcRenderer.invoke('saveFileDialog', defaultName),

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('readFile', filePath),

  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('writeFile', { filePath, content }),

  makeDirectory: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke('makeDirectory', dirPath),

  showUnsavedDialog: (): Promise<'save' | 'discard' | 'cancel'> =>
    ipcRenderer.invoke('showUnsavedDialog'),

  onMenuAction: (callback: (action: string) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, action: string) => callback(action)
    ipcRenderer.on('menu-action', handler)
    return () => ipcRenderer.removeListener('menu-action', handler)
  },

  onToggleDarkMode: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('toggle-dark-mode', handler)
    return () => ipcRenderer.removeListener('toggle-dark-mode', handler)
  },

  onBeforeClose: (callback: () => Promise<void>): (() => void) => {
    const handler = async () => { await callback() }
    ipcRenderer.on('before-close', handler)
    return () => ipcRenderer.removeListener('before-close', handler)
  },

  closeConfirmed: (): void => {
    ipcRenderer.send('close-confirmed')
  },

  quitApp: (): Promise<void> =>
    ipcRenderer.invoke('quitApp'),

  windowMinimize: (): Promise<void> =>
    ipcRenderer.invoke('windowMinimize'),

  windowMaximize: (): Promise<void> =>
    ipcRenderer.invoke('windowMaximize'),

  windowClose: (): Promise<void> =>
    ipcRenderer.invoke('windowClose'),

  windowIsMaximized: (): Promise<boolean> =>
    ipcRenderer.invoke('windowIsMaximized'),

  onMaximizeChange: (callback: (maximized: boolean) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, maximized: boolean) => callback(maximized)
    ipcRenderer.on('maximize-change', handler)
    return () => ipcRenderer.removeListener('maximize-change', handler)
  },
})
