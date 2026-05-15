import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { Feather, X } from 'lucide-react'
import Editor, { type EditorHandle } from './components/Editor'
import WindowControls from './components/WindowControls'
import WelcomePage from './components/WelcomePage'
import Toolbar from './components/Toolbar'
import StatusBar from './components/StatusBar'
import Sidebar from './components/Sidebar'
import SettingsPanel, { loadSettings, type EditorSettings } from './components/SettingsPanel'
import type { FolderEntry, InlineFormatType, BlockFormatType } from './types'

const MermaidDialog = lazy(() => import('./components/MermaidDialog'))
const FormulaDialog = lazy(() => import('./components/FormulaDialog'))

const LINKED_FOLDER_KEY = 'markdown-editor-linked-folder'

function App() {
  const editorRef = useRef<EditorHandle>(null)

  const [darkMode, setDarkMode] = useState(false)
  const [isModified, setIsModified] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [cursorLine, setCursorLine] = useState(1)
  const [cursorCol, setCursorCol] = useState(1)
  const [wordCount, setWordCount] = useState(0)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [folderEntries, setFolderEntries] = useState<FolderEntry[]>([])
  const [linkedFolderPath, setLinkedFolderPath] = useState<string | null>(() => localStorage.getItem(LINKED_FOLDER_KEY))
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [showMermaidDialog, setShowMermaidDialog] = useState(false)
  const [showFormulaDialog, setShowFormulaDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<EditorSettings>(loadSettings)
  const sidebarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hide sidebar when mouse leaves the window
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current)
        setSidebarVisible(false)
      }
    }
    document.addEventListener('mouseout', handle)
    return () => document.removeEventListener('mouseout', handle)
  }, [])

  useEffect(() => {
    const cleanup = window.electronAPI?.onToggleDarkMode(() => {
      setDarkMode(prev => !prev)
    })
    return () => cleanup?.()
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const confirmUnsaved = useCallback(async (): Promise<boolean> => {
    const editor = editorRef.current
    if (!editor || !editor.getModified()) return true
    const action = await window.electronAPI?.showUnsavedDialog()
    if (action === 'cancel') return false
    if (action === 'save') await editor.saveFile()
    return true
  }, [])

  const handleExit = useCallback(async () => {
    if (await confirmUnsaved()) {
      await window.electronAPI?.quitApp()
    }
  }, [confirmUnsaved])

  const beforeClose = useCallback(async () => {
    if (await confirmUnsaved()) {
      window.electronAPI?.closeConfirmed()
    }
  }, [confirmUnsaved])

  useEffect(() => {
    const cleanup = window.electronAPI?.onMenuAction(async (action) => {
      const editor = editorRef.current
      if (!editor) return
      switch (action) {
        case 'new':
          setShowWelcome(false)
          await editor.newFile()
          break
        case 'open':
          setShowWelcome(false)
          await editor.openFile()
          break
        case 'save':
          setShowWelcome(false)
          await editor.saveFile()
          break
        case 'save-as':
          await editor.saveAs()
          break
        case 'exit':
          await handleExit()
          break
        case 'undo':
          editor.undo()
          break
        case 'redo':
          editor.redo()
          break
        case 'cut':
          editor.focus()
          document.execCommand('cut')
          break
        case 'copy':
          editor.focus()
          document.execCommand('copy')
          break
        case 'paste':
          editor.focus()
          document.execCommand('paste')
          break
      }
    })
    return () => cleanup?.()
  }, [handleExit])

  useEffect(() => {
    const cleanup = window.electronAPI?.onBeforeClose(beforeClose)
    return () => cleanup?.()
  }, [beforeClose])

  const handleNew = useCallback(() => {
    setShowWelcome(false)
    setHasContent(true)
    setTimeout(() => editorRef.current?.newFile(), 0)
  }, [])

  const handleSave = useCallback(() => {
    setShowWelcome(false)
    editorRef.current?.saveFile()
  }, [])

  // Auto-load linked folder on startup
  useEffect(() => {
    if (linkedFolderPath) {
      ;(async () => {
        const entries = await window.electronAPI?.readDirectoryRecursive(linkedFolderPath)
        if (entries) {
          setFolderPath(linkedFolderPath)
          setFolderEntries(entries)
          setSidebarVisible(true)
        }
      })()
    }
  }, [])

  const handleLinkFolder = useCallback(async () => {
    const result = await window.electronAPI?.openFolderDialog()
    if (result) {
      localStorage.setItem(LINKED_FOLDER_KEY, result.folderPath)
      setLinkedFolderPath(result.folderPath)
      setFolderPath(result.folderPath)
      const entries = await window.electronAPI?.readDirectoryRecursive(result.folderPath)
      setFolderEntries(entries || result.entries)
      setSidebarVisible(true)
    }
  }, [])

  const handleContentChange = useCallback((content: string) => {
    if (showWelcome && content) {
      setShowWelcome(false)
      setHasContent(true)
    }
  }, [showWelcome])

  const handleImageSubmit = useCallback(() => {
    const url = imageUrlInput.trim()
    if (!url) return
    const editor = editorRef.current
    if (editor) {
      editor.formatInline('image', url)
      editor.focus()
    }
    setShowImageInput(false)
    setImageUrlInput('')
  }, [imageUrlInput])

  const handleFormat = useCallback((type: InlineFormatType, url?: string) => {
    const editor = editorRef.current
    if (!editor) return
    if (type === 'image') {
      setImageUrlInput('https://')
      setShowImageInput(true)
      return
    }
    editor.formatInline(type, url)
  }, [])

  const closeImageInput = useCallback(() => { setShowImageInput(false); setImageUrlInput('') }, [])

  const handleBlock = useCallback((type: BlockFormatType) => {
    const editor = editorRef.current
    if (!editor) return
    if (type === 'mermaid') { setShowMermaidDialog(true); return }
    if (type === 'math') { setShowFormulaDialog(true); return }
    editor.insertBlock(type)
  }, [])

  const handleMermaidInsert = useCallback((code: string) => {
    const editor = editorRef.current
    if (!editor) return
    try {
      editor.insertText('```mermaid\n' + code + '\n```')
    } catch (e) {
      console.error('insert mermaid failed:', e)
    }
    setShowMermaidDialog(false)
  }, [])

  const handleFormulaInsert = useCallback((expression: string, displayMode: boolean) => {
    const editor = editorRef.current
    if (!editor) return
    const wrapped = displayMode ? `$$\n${expression}\n$$` : `$${expression}$`
    try {
      editor.insertText(wrapped)
    } catch (e) {
      console.error('insert formula failed:', e)
    }
    setShowFormulaDialog(false)
  }, [])

  const handleUndo = useCallback(() => {
    editorRef.current?.undo()
  }, [])

  const handleRedo = useCallback(() => {
    editorRef.current?.redo()
  }, [])

  const handleOpenFile = useCallback(async (filePath: string) => {
    const editor = editorRef.current
    if (!editor) return
    const content = await window.electronAPI?.readFile(filePath)
    if (content != null) {
      setShowWelcome(false)
      setHasContent(true)
      const fileName = filePath.replace(/.*[/\\]/, '').replace(/\.\w+$/, '')
      editor.setTitle(fileName)
      editor.setContent(content)
      editor.resetModified()
      editor.focus()
    }
  }, [])

  const handleSidebarMouseEnter = useCallback(() => {
    if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current)
    setSidebarVisible(true)
  }, [])

  const handleSidebarMouseLeave = useCallback(() => {
    sidebarTimerRef.current = setTimeout(() => {
      setSidebarVisible(false)
    }, 1000)
  }, [])

  const handleToggleSidebar = useCallback(async () => {
    if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current)
    if (sidebarVisible) {
      setSidebarVisible(false)
      return
    }
    if (linkedFolderPath) {
      const entries = await window.electronAPI?.readDirectoryRecursive(linkedFolderPath)
      if (entries) {
        setFolderPath(linkedFolderPath)
        setFolderEntries(entries)
      }
    }
    setSidebarVisible(true)
  }, [sidebarVisible, linkedFolderPath])

  const handleRefreshFolder = useCallback(async () => {
    if (!linkedFolderPath) return
    const entries = await window.electronAPI?.readDirectoryRecursive(linkedFolderPath)
    if (entries) {
      setFolderEntries(entries)
    }
  }, [linkedFolderPath])

  const handleSettingsChange = useCallback((newSettings: EditorSettings) => {
    setSettings(newSettings)
  }, [])

  const handleHome = useCallback(() => {
    setShowWelcome(true)
    setHasContent(false)
    setFolderPath(null)
    setFolderEntries([])
    setSidebarVisible(false)
    editorRef.current?.setContent('')
    editorRef.current?.resetModified()
  }, [])

  return (
    <div className="h-screen w-screen bg-[#f5f5f7] dark:bg-[#1c1c1e] flex flex-col">
      {/* Title bar - distinct and prominent */}
      <div
        className="titlebar h-10 w-full flex-shrink-0 flex items-center bg-[#f5f5f7] dark:bg-[#1c1c1e] border-b border-[#e5e5e5] dark:border-[#38383a] px-4"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <WindowControls />
        </div>

        <div className="flex-1 flex items-center justify-center gap-2">
          <Feather size={13} className="text-[#007aff] dark:text-[#0a84ff]" />
          <span className="text-xs text-[#86868f] dark:text-[#98989d] select-none font-medium tracking-wide">
            Markdown Editor
          </span>
        </div>

        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} />
      </div>

      {/* Toolbar - formatting tools guarded when welcome page is showing */}
      <Toolbar
        darkMode={darkMode}
        onNew={handleNew}
        onSave={() => { if (!showWelcome) handleSave() }}
        onToggleDarkMode={() => setDarkMode(prev => !prev)}
        onSettings={() => setShowSettings(true)}
        onHome={handleHome}
        onToggleSidebar={handleToggleSidebar}
        onFormat={(type, url) => { if (!showWelcome) handleFormat(type, url) }}
        onBlock={(type) => { if (!showWelcome) handleBlock(type) }}
        onUndo={() => { if (!showWelcome) handleUndo() }}
        onRedo={() => { if (!showWelcome) handleRedo() }}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Editor area (full width, sidebar overlays on top) */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Sidebar - left overlay panel (does not push content) */}
          <Sidebar
            onNew={handleNew}
            onOpenFile={handleOpenFile}
            folderPath={folderPath}
            folderEntries={folderEntries}
            onLinkFolder={handleLinkFolder}
            linkedFolderPath={linkedFolderPath}
            isVisible={sidebarVisible}
            onMouseEnter={handleSidebarMouseEnter}
            onMouseLeave={handleSidebarMouseLeave}
            onRefreshFolder={handleRefreshFolder}
          />

          {showWelcome && (
            <WelcomePage
              onNew={handleNew}
              onOpenFile={handleOpenFile}
              onLinkFolder={handleLinkFolder}
              linkedFolderPath={linkedFolderPath}
            />
          )}

          <div className={`h-full transition-opacity duration-150 ${showWelcome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Editor
              ref={editorRef}
              darkMode={darkMode}
              settings={settings}
              linkedFolderPath={linkedFolderPath}
              onModifiedChange={setIsModified}
              onContentChange={handleContentChange}
              onCursorChange={(line, col) => { setCursorLine(line); setCursorCol(col) }}
              onWordCountChange={setWordCount}
            />
          </div>
        </div>
      </div>

      {showImageInput && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-16 bg-black/10">
          <div className="bg-white dark:bg-[#2c2c2e] rounded-xl shadow-2xl p-4 border border-[#e5e5e5] dark:border-[#38383a] min-w-[360px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">插入图片 URL</span>
              <button
                onClick={closeImageInput}
                className="w-6 h-6 flex items-center justify-center text-[#86868f] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              value={imageUrlInput}
              onChange={e => setImageUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleImageSubmit(); if (e.key === 'Escape') closeImageInput() }}
              placeholder="https://..."
              className="w-full h-9 px-3 text-sm bg-[#f5f5f7] dark:bg-[#1c1c1e] border border-[#e5e5e5] dark:border-[#38383a] rounded-lg outline-none text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#aeaeb2] focus:border-[#007aff] dark:focus:border-[#0a84ff] transition-colors"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={closeImageInput}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#e5e5e5] dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] hover:opacity-80 transition-opacity"
              >
                取消
              </button>
              <button
                onClick={handleImageSubmit}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#007aff] text-white hover:bg-[#0066d6] transition-colors"
              >
                插入
              </button>
            </div>
          </div>
        </div>
      )}

      {showMermaidDialog && (
        <Suspense fallback={null}>
          <MermaidDialog
            onInsert={handleMermaidInsert}
            onClose={() => setShowMermaidDialog(false)}
          />
        </Suspense>
      )}

      {showFormulaDialog && (
        <Suspense fallback={null}>
          <FormulaDialog
            onInsert={handleFormulaInsert}
            onClose={() => setShowFormulaDialog(false)}
          />
        </Suspense>
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      <StatusBar
        wordCount={wordCount}
        cursorLine={cursorLine}
        cursorCol={cursorCol}
        isModified={isModified}
        hasContent={hasContent}
      />
    </div>
  )
}

export default App
