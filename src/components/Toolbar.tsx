import { useState, useRef, useEffect } from 'react'
import {
  FilePlus, Save, FolderOpen, Moon, Sun,
  Bold, Italic, Strikethrough, Code, Link2,
  Type, Quote, List, ListOrdered, CheckSquare,
  Table, Image, Minus, FileCode, Undo2, Redo2,
  PieChart, Sigma, MoreHorizontal, Settings, Home,
  Highlighter,
} from 'lucide-react'
import type { InlineFormatType, BlockFormatType } from '../types'

interface ToolbarProps {
  darkMode: boolean
  onNew: () => void
  onSave: () => void
  onToggleDarkMode: () => void
  onSettings?: () => void
  onHome?: () => void
  onToggleSidebar?: () => void
  onFormat?: (type: InlineFormatType, url?: string) => void
  onBlock?: (type: BlockFormatType) => void
  onUndo?: () => void
  onRedo?: () => void
}

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

function Toolbar({
  darkMode,
  onNew,
  onSave,
  onToggleDarkMode,
  onSettings,
  onHome,
  onToggleSidebar,
  onFormat,
  onBlock,
  onUndo,
  onRedo,
}: ToolbarProps) {
  const [showHeading, setShowHeading] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const headingRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
        setShowHeading(false)
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const headingLabels: { level: HeadingLevel; label: string; shortcut: string }[] = [
    { level: 'h1', label: 'Heading 1', shortcut: '#' },
    { level: 'h2', label: 'Heading 2', shortcut: '##' },
    { level: 'h3', label: 'Heading 3', shortcut: '###' },
    { level: 'h4', label: 'Heading 4', shortcut: '####' },
    { level: 'h5', label: 'Heading 5', shortcut: '#####' },
    { level: 'h6', label: 'Heading 6', shortcut: '######' },
  ]

  const btn = 'w-7 h-7 flex items-center justify-center text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#2c2c2e] rounded-md transition-colors text-xs'
  const separator = 'w-px h-5 bg-[#e5e5e5] dark:bg-[#38383a] mx-1'

  return (
    <div className="h-10 bg-[#f5f5f7] dark:bg-[#1c1c1e] border-b border-[#e5e5e5] dark:border-[#38383a] flex items-center px-2 gap-0.5 select-none flex-shrink-0 relative">
      {/* Home */}
      {onHome && (
        <button onClick={onHome} className={btn} title="主页">
          <Home size={15} />
        </button>
      )}

      {/* File operations */}
      <button onClick={onNew} className={btn} title="新建 (⌘N)"><FilePlus size={15} /></button>
      <button onClick={onSave} className={btn} title="保存 (⌘S)"><Save size={15} /></button>

      <div className={separator} />

      {/* Sidebar toggle */}
      {onToggleSidebar && (
        <button onClick={onToggleSidebar} className={btn} title="浏览文件">
          <FolderOpen size={15} />
        </button>
      )}

      <div className={separator} />

      {/* Undo / Redo */}
      <button onClick={onUndo} className={btn} title="撤销 (⌘Z)"><Undo2 size={14} /></button>
      <button onClick={onRedo} className={btn} title="重做 (⌘⇧Z)"><Redo2 size={14} /></button>

      <div className={separator} />

      {/* Heading dropdown */}
      <div className="relative" ref={headingRef}>
        <button className={btn} title="标题" onClick={() => setShowHeading(v => !v)}><Type size={15} /></button>
        {showHeading && (
          <div className="absolute top-full left-0 mt-0.5 bg-white dark:bg-[#2c2c2e] rounded-lg shadow-xl border border-[#e5e5e5] dark:border-[#38383a] py-1 min-w-[160px] z-50">
            {headingLabels.map(h => (
              <button
                key={h.level}
                className="w-full px-3 py-1.5 text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] flex items-center gap-2 transition-colors"
                onClick={() => { onBlock?.(h.level); setShowHeading(false) }}
              >
                <span className="font-mono text-[#86868f] w-6">{h.shortcut}</span>
                <span>{h.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Inline formatting */}
      <button onClick={() => onFormat?.('bold')} className={btn} title="加粗 (⌘B)"><Bold size={14} /></button>
      <button onClick={() => onFormat?.('italic')} className={btn} title="斜体 (⌘I)"><Italic size={14} /></button>
      <button onClick={() => onFormat?.('strikethrough')} className={btn} title="删除线"><Strikethrough size={14} /></button>
      <button onClick={() => onFormat?.('highlight')} className={btn} title="高亮"><Highlighter size={14} /></button>
      <button onClick={() => onFormat?.('code')} className={btn} title="行内代码"><Code size={14} /></button>
      <button onClick={() => onFormat?.('link')} className={btn} title="链接"><Link2 size={14} /></button>

      <div className={separator} />

      {/* Block elements */}
      <button onClick={() => onBlock?.('quote')} className={btn} title="引用"><Quote size={14} /></button>
      <button onClick={() => onBlock?.('ul')} className={btn} title="无序列表"><List size={14} /></button>
      <button onClick={() => onBlock?.('ol')} className={btn} title="有序列表"><ListOrdered size={14} /></button>
      <button onClick={() => onBlock?.('task')} className={btn} title="任务列表"><CheckSquare size={14} /></button>
      <button onClick={() => onBlock?.('codeblock')} className={btn} title="代码块"><FileCode size={14} /></button>

      <div className={separator} />

      {/* More menu - advanced features */}
      <div className="relative" ref={moreRef}>
        <button className={btn} title="更多" onClick={() => setShowMoreMenu(v => !v)}>
          <MoreHorizontal size={15} />
        </button>
        {showMoreMenu && (
          <div className="absolute top-full right-0 mt-0.5 bg-white dark:bg-[#2c2c2e] rounded-lg shadow-xl border border-[#e5e5e5] dark:border-[#38383a] py-1 min-w-[160px] z-50">
            <button
              onClick={() => { onBlock?.('table'); setShowMoreMenu(false) }}
              className="w-full px-3 py-1.5 text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] flex items-center gap-2 transition-colors"
            >
              <Table size={14} />
              <span>表格</span>
            </button>
            <button
              onClick={() => { onFormat?.('image'); setShowMoreMenu(false) }}
              className="w-full px-3 py-1.5 text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] flex items-center gap-2 transition-colors"
            >
              <Image size={14} />
              <span>插入图片</span>
            </button>
            <button
              onClick={() => { onBlock?.('hr'); setShowMoreMenu(false) }}
              className="w-full px-3 py-1.5 text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] flex items-center gap-2 transition-colors"
            >
              <Minus size={14} />
              <span>分隔线</span>
            </button>
            <button
              onClick={() => { onBlock?.('mermaid'); setShowMoreMenu(false) }}
              className="w-full px-3 py-1.5 text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] flex items-center gap-2 transition-colors"
            >
              <PieChart size={14} />
              <span>Mermaid 图表</span>
            </button>
            <button
              onClick={() => { onBlock?.('math'); setShowMoreMenu(false) }}
              className="w-full px-3 py-1.5 text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] flex items-center gap-2 transition-colors"
            >
              <Sigma size={14} />
              <span>数学公式</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Settings */}
      {onSettings && (
        <button onClick={onSettings} className={btn} title="设置">
          <Settings size={15} />
        </button>
      )}

      {/* Dark mode */}
      <button onClick={onToggleDarkMode} className={btn} title={darkMode ? '浅色模式' : '深色模式'}>
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </div>
  )
}

export default Toolbar
