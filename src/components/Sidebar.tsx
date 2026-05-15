import { useState, useCallback, useEffect } from 'react'
import {
  FilePlus, FileText, Folder, FolderOpen, Search,
  ChevronRight, ChevronDown, Link2, Unlink, RefreshCw,
  List, FolderTree,
} from 'lucide-react'
import type { FolderEntry } from '../types'

interface SidebarProps {
  onNew: () => void
  onOpenFile?: (filePath: string) => void
  folderPath?: string | null
  folderEntries?: FolderEntry[]
  onLinkFolder?: () => void
  linkedFolderPath?: string | null
  isVisible: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onRefreshFolder?: () => void
}

function Sidebar({
  onNew, onOpenFile, folderPath, folderEntries,
  onLinkFolder, linkedFolderPath,
  isVisible, onMouseEnter, onMouseLeave, onRefreshFolder,
}: SidebarProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [subEntries, setSubEntries] = useState<Record<string, FolderEntry[]>>({})
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree')

  useEffect(() => {
    if (!isVisible) {
      setSearchQuery('')
    }
  }, [isVisible])

  const toggleDir = useCallback(async (dirPath: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(dirPath)) {
        next.delete(dirPath)
      } else {
        next.add(dirPath)
      }
      return next
    })
    if (!expandedDirs.has(dirPath) && !subEntries[dirPath]) {
      const entries = await window.electronAPI?.readDirectory(dirPath)
      if (entries) {
        setSubEntries(prev => ({ ...prev, [dirPath]: entries }))
      }
    }
  }, [expandedDirs, subEntries])

  const matchesSearch = useCallback((name: string) => {
    return !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase())
  }, [searchQuery])

  const dirHasMatchingChild = useCallback((dirPath: string) => {
    if (!searchQuery) return false
    const children = subEntries[dirPath] || []
    return children.some(e => matchesSearch(e.name))
  }, [searchQuery, subEntries, matchesSearch])

  const filteredEntries = folderEntries?.filter(e => matchesSearch(e.name) || (e.isDirectory && dirHasMatchingChild(e.path))) ?? []
  const mdEntries = (folderEntries || []).filter(e => !e.isDirectory && /\.(md|markdown)$/i.test(e.name) && matchesSearch(e.name))

  return (
    <>
      {!isVisible && (
        <div
          className="absolute left-0 top-0 bottom-0 w-5 z-30"
          onMouseEnter={onMouseEnter}
        />
      )}

      <div
        className={`absolute left-0 top-0 bottom-0 w-64 z-20 bg-[#f5f5f7] dark:bg-[#1c1c1e] border-r border-[#e5e5e5] dark:border-[#38383a] flex flex-col select-none shadow-xl transition-all duration-500 ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Search + buttons */}
        <div className="h-10 flex items-center px-3 gap-1 border-b border-[#e5e5e5] dark:border-[#38383a] flex-shrink-0">
          <div className="flex-1 relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#aeaeb2] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className="w-full h-7 pl-7 pr-2 text-xs bg-white dark:bg-[#2c2c2e] border border-[#e5e5e5] dark:border-[#38383a] rounded-md outline-none text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#aeaeb2] focus:border-[#007aff] dark:focus:border-[#0a84ff] transition-colors"
            />
          </div>
          <button
            onClick={() => setViewMode(v => v === 'tree' ? 'flat' : 'tree')}
            className="w-7 h-7 flex items-center justify-center text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#2c2c2e] rounded-md transition-colors flex-shrink-0"
            title={viewMode === 'tree' ? '列表视图' : '文件夹视图'}
          >
            {viewMode === 'tree' ? <List size={14} /> : <FolderTree size={14} />}
          </button>
          <button
            onClick={onNew}
            className="w-7 h-7 flex items-center justify-center text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#2c2c2e] rounded-md transition-colors flex-shrink-0"
            title="新建文档"
          >
            <FilePlus size={15} />
          </button>
          {onRefreshFolder && linkedFolderPath && (
            <button
              onClick={onRefreshFolder}
              className="w-7 h-7 flex items-center justify-center text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#2c2c2e] rounded-md transition-colors flex-shrink-0"
              title="刷新"
            >
              <RefreshCw size={13} />
            </button>
          )}
        </div>

        {/* Files */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {!folderPath ? (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white dark:bg-[#2c2c2e] border border-[#e5e5e5] dark:border-[#38383a]">
              <FileText size={16} className="text-[#007aff] dark:text-[#0a84ff] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate">无标题文档</p>
                <p className="text-[11px] text-[#aeaeb2] mt-0.5">未保存</p>
              </div>
            </div>
          ) : viewMode === 'flat' ? (
            mdEntries.length === 0 ? (
              <p className="text-xs text-[#aeaeb2] text-center pt-6">无匹配文件</p>
            ) : (
              mdEntries.map(entry => (
                <button
                  key={entry.path}
                  onClick={() => onOpenFile?.(entry.path)}
                  className="w-full rounded-xl bg-white dark:bg-[#2c2c2e] border border-[#e5e5e5] dark:border-[#38383a] p-3 hover:shadow-md hover:border-[#007aff]/30 dark:hover:border-[#0a84ff]/30 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#007aff]/10 dark:bg-[#0a84ff]/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-[#007aff] dark:text-[#0a84ff]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{entry.name.replace(/\.(md|markdown)$/i, '')}</p>
                      <p className="text-[11px] text-[#aeaeb2] truncate mt-0.5">{folderPath ? entry.path.replace(folderPath, '').replace(/^[/\\]/, '') : ''}</p>
                    </div>
                  </div>
                </button>
              ))
            )
          ) : (
            /* Tree view - root level entries only, subdirs expand on demand */
            (() => {
              const isRootLevel = (entry: FolderEntry) => {
                if (!folderPath) return true
                const rel = entry.path.replace(folderPath, '').replace(/^[/\\]/, '')
                return !rel.includes('/') && !rel.includes('\\')
              }
              const visibleRoot = filteredEntries.filter(e =>
                isRootLevel(e) && (
                  !e.isDirectory
                    ? /\.(md|markdown)$/i.test(e.name)
                    : (subEntries[e.path] ? (subEntries[e.path].some(s => /\.(md|markdown)$/i.test(s.name))) : true)
                )
              )
              return visibleRoot.length === 0 ? (
                <p className="text-xs text-[#aeaeb2] text-center pt-6">无匹配文件</p>
              ) : (
                visibleRoot.map(entry => (
                  <div key={entry.path}>
                    {entry.isDirectory ? (
                      <div>
                        <button
                          onClick={() => toggleDir(entry.path)}
                          className="w-full rounded-xl bg-white dark:bg-[#2c2c2e] border border-[#e5e5e5] dark:border-[#38383a] p-3 hover:shadow-md hover:border-[#007aff]/30 dark:hover:border-[#0a84ff]/30 transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#007aff]/10 dark:bg-[#0a84ff]/10 flex items-center justify-center flex-shrink-0">
                              {expandedDirs.has(entry.path)
                                ? <FolderOpen size={16} className="text-[#007aff] dark:text-[#0a84ff]" />
                                : <Folder size={16} className="text-[#007aff] dark:text-[#0a84ff]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{entry.name}</p>
                              <p className="text-[11px] text-[#aeaeb2] truncate mt-0.5">文件夹</p>
                            </div>
                            <div className="flex-shrink-0">
                              {expandedDirs.has(entry.path)
                                ? <ChevronDown size={14} className="text-[#aeaeb2]" />
                                : <ChevronRight size={14} className="text-[#aeaeb2]" />}
                            </div>
                          </div>
                        </button>
                        {expandedDirs.has(entry.path) && (
                          <div className="mt-1 ml-4 space-y-1">
                            {(subEntries[entry.path] || []).filter(e =>
                              (e.isDirectory || /\.(md|markdown)$/i.test(e.name)) && matchesSearch(e.name)
                            ).map(sub => (
                              sub.isDirectory ? (
                                <div key={sub.path} className="px-3 py-2 text-xs text-[#86868f] truncate">
                                  <Folder size={12} className="inline mr-1" />{sub.name}
                                </div>
                              ) : (
                                <button
                                  key={sub.path}
                                  onClick={() => onOpenFile?.(sub.path)}
                                  className="w-full rounded-lg bg-white/50 dark:bg-[#2c2c2e]/50 border border-[#e5e5e5] dark:border-[#38383a] px-3 py-2 hover:bg-white dark:hover:bg-[#2c2c2e] hover:shadow-sm transition-all text-left"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-md bg-[#007aff]/8 dark:bg-[#0a84ff]/8 flex items-center justify-center flex-shrink-0">
                                      <FileText size={12} className="text-[#007aff]" />
                                    </div>
                                    <p className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{sub.name.replace(/\.(md|markdown)$/i, '')}</p>
                                  </div>
                                </button>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenFile?.(entry.path)}
                        className="w-full rounded-xl bg-white dark:bg-[#2c2c2e] border border-[#e5e5e5] dark:border-[#38383a] p-3 hover:shadow-md hover:border-[#007aff]/30 dark:hover:border-[#0a84ff]/30 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#007aff]/10 dark:bg-[#0a84ff]/10 flex items-center justify-center flex-shrink-0">
                            <FileText size={16} className="text-[#007aff] dark:text-[#0a84ff]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{entry.name.replace(/\.(md|markdown)$/i, '')}</p>
                            <p className="text-[11px] text-[#aeaeb2] truncate mt-0.5">{folderPath ? entry.path.replace(folderPath, '').replace(/^[/\\]/, '') : ''}</p>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                ))
              )
            })()
          )}
        </div>

        {/* Bottom: Linked folder button */}
        <div className="flex-shrink-0 border-t border-[#e5e5e5] dark:border-[#38383a] px-3 py-2.5">
          {linkedFolderPath ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onLinkFolder}
                className="flex-1 flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#2c2c2e] border border-[#e5e5e5] dark:border-[#38383a] text-[#007aff] dark:text-[#0a84ff] hover:shadow-sm transition-all truncate"
                title="更换关联文件夹"
              >
                <Link2 size={12} />
                <span className="truncate">{linkedFolderPath.split(/[/\\]/).pop()}</span>
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('markdown-editor-linked-folder')
                  window.location.reload()
                }}
                className="w-7 h-7 flex items-center justify-center text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#2c2c2e] rounded-md transition-colors"
                title="解除关联"
              >
                <Unlink size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={onLinkFolder}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-dashed border-[#c7c7cc] dark:border-[#48484a] text-[#86868f] dark:text-[#98989d] hover:border-[#007aff] dark:hover:border-[#0a84ff] hover:text-[#007aff] dark:hover:text-[#0a84ff] transition-all"
            >
              <Link2 size={12} />
              <span>关联文件夹</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default Sidebar
