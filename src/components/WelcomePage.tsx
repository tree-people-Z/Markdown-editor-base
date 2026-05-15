import { useState, useEffect } from 'react'
import { FilePlus, Feather, FileText, Folder, Link2 } from 'lucide-react'
import type { FolderEntry } from '../types'

interface WelcomePageProps {
  onNew: () => void
  onOpenFile?: (filePath: string) => void
  onLinkFolder?: () => void
  linkedFolderPath?: string | null
}

function WelcomePage({ onNew, onOpenFile, onLinkFolder, linkedFolderPath }: WelcomePageProps) {
  const [showNotes, setShowNotes] = useState(false)
  const [allMdFiles, setAllMdFiles] = useState<FolderEntry[]>([])

  useEffect(() => {
    setShowNotes(false)
  }, [linkedFolderPath])

  const handleViewNotes = async () => {
    setShowNotes(true)
    if (linkedFolderPath) {
      const entries = await window.electronAPI?.readDirectoryRecursive(linkedFolderPath)
      if (entries) {
        setAllMdFiles(entries.filter(e => !e.isDirectory && /\.(md|markdown)$/i.test(e.name)))
      }
    }
  }

  if (showNotes) {
    return (
      <div className="absolute inset-0 bg-[#f5f5f7] dark:bg-[#1c1c1e] flex flex-col select-none z-10">
        {/* Back button */}
        <div className="px-4 pt-3">
          <button
            onClick={() => setShowNotes(false)}
            className="text-xs text-[#007aff] dark:text-[#0a84ff] hover:opacity-80 transition-opacity"
          >
            ← 返回
          </button>
        </div>

        {/* Files */}
        <div className="flex-1 overflow-y-auto p-4">
          {!linkedFolderPath ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Folder size={32} className="text-[#aeaeb2] mb-3" />
              <p className="text-sm text-[#86868f] dark:text-[#98989d] mb-4">尚未关联文件夹</p>
              {onLinkFolder && (
                <button
                  onClick={onLinkFolder}
                  className="px-4 py-2 text-xs rounded-lg bg-[#007aff] text-white hover:bg-[#0066d6] transition-colors flex items-center gap-2"
                >
                  <Link2 size={14} />
                  关联文件夹
                </button>
              )}
            </div>
          ) : allMdFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText size={32} className="text-[#aeaeb2] mb-3" />
              <p className="text-sm text-[#86868f] dark:text-[#98989d]">该文件夹中暂无 Markdown 文件</p>
              <button
                onClick={onNew}
                className="mt-4 px-4 py-2 text-xs rounded-lg bg-[#007aff] text-white hover:bg-[#0066d6] transition-colors flex items-center gap-2"
              >
                <FilePlus size={14} />
                新建笔记
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allMdFiles.map(entry => {
                const preview = entry.preview || ''
                const lines = preview.split('\n')
                const title = entry.name.replace(/\.(md|markdown)$/i, '')
                const bodyLines = lines.filter(l => !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('-') && !l.match(/^\d+\.\s/)).join(' ').trim().slice(0, 120)
                return (
                  <button
                    key={entry.path}
                    onClick={() => onOpenFile?.(entry.path)}
                    className="bg-white dark:bg-[#2c2c2e] rounded-xl border border-[#e5e5e5] dark:border-[#38383a] p-4 hover:shadow-md hover:border-[#007aff]/30 dark:hover:border-[#0a84ff]/30 transition-all text-left group flex flex-col"
                  >
                    <p className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] line-clamp-1 mb-1">
                      {title}
                    </p>
                    {bodyLines && (
                      <p className="text-[11px] text-[#aeaeb2] leading-relaxed line-clamp-2 flex-1">
                        {bodyLines}
                      </p>
                    )}
                    <p className="text-[10px] text-[#c7c7cc] dark:text-[#48484a] mt-2 truncate">
                      {linkedFolderPath ? entry.path.replace(linkedFolderPath, '').replace(/^[/\\]/, '').replace(/[/\\][^/\\]+$/, '') || '' : ''}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-[#f5f5f7] dark:bg-[#1c1c1e] flex flex-col items-center justify-center select-none z-10">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#007aff] to-[#5856d6] flex items-center justify-center mb-6 shadow-lg shadow-[#007aff]/20">
        <Feather size={28} className="text-white" />
      </div>
      <h1 className="text-3xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-2 tracking-tight">
        Markdown Editor
      </h1>
      <p className="text-sm text-[#86868f] dark:text-[#98989d] mb-10 font-normal">
        简洁优雅的笔记工具，支持实时预览、图表和数学公式
      </p>
      <div className="flex gap-3">
        <button
          onClick={onNew}
          className="px-6 py-2.5 text-sm rounded-lg bg-[#007aff] text-white hover:bg-[#0066d6] transition-colors font-medium flex items-center gap-2 shadow-sm"
        >
          <FilePlus size={16} />
          新建笔记
        </button>
        <button
          onClick={handleViewNotes}
          className="px-6 py-2.5 text-sm rounded-lg bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] transition-colors font-medium flex items-center gap-2 border border-[#e5e5e5] dark:border-[#38383a] shadow-sm"
        >
          <Feather size={16} />
          查看笔记
        </button>
      </div>
      <p className="mt-10 text-xs text-[#aeaeb2] dark:text-[#636366]">
        或按 <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#2c2c2e] border border-[#e5e5e5] dark:border-[#38383a] rounded text-[10px] font-mono">⌘N</kbd> 快速新建
      </p>
    </div>
  )
}

export default WelcomePage
