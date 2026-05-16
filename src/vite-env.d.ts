/// <reference types="vite/client" />

interface ElectronAPI {
  openFolderDialog: () => Promise<{ folderPath: string; entries: FolderEntry[] } | null>
  readDirectory: (dirPath: string) => Promise<FolderEntry[]>
  readDirectoryRecursive: (dirPath: string) => Promise<FolderEntry[]>
  openFileDialog: () => Promise<{ content: string; filePath: string } | null>
  saveFileDialog: (defaultName?: string) => Promise<string | null>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<void>
  makeDirectory: (dirPath: string) => Promise<void>
  showUnsavedDialog: () => Promise<'save' | 'discard' | 'cancel'>
  onMenuAction: (callback: (action: string) => void) => () => void
  onToggleDarkMode: (callback: () => void) => () => void
  onBeforeClose: (callback: () => Promise<void>) => () => void
  closeConfirmed: () => void
  quitApp: () => Promise<void>

  windowMinimize: () => Promise<void>
  windowMaximize: () => Promise<void>
  windowClose: () => Promise<void>
  windowIsMaximized: () => Promise<boolean>
  onMaximizeChange: (callback: (maximized: boolean) => void) => () => void
  exportHtmlDialog: (markdown: string, darkMode: boolean) => Promise<string | null>
  exportPdf: (markdown: string, darkMode: boolean) => Promise<string | null>
}

interface Window {
  electronAPI?: ElectronAPI
}
