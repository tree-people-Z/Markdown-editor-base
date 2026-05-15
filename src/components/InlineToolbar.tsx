import { useState, useRef, useCallback, useEffect } from 'react'
import { Bold, Italic, Strikethrough, Highlighter, Code, Link2, Check, Quote, List, CheckSquare, Type, PieChart, Sigma } from 'lucide-react'
import { HEADING_ENTRIES } from '../types'

interface InlineToolbarProps {
  top: number
  left: number
  onBold: () => void
  onItalic: () => void
  onStrikethrough: () => void
  onHighlight: () => void
  onCode: () => void
  onLink: (url: string) => void
  onHeading: (level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => void
  onQuote: () => void
  onList: () => void
  onTask: () => void
  onMermaid?: () => void
  onMath?: () => void
  onClose: () => void
}

function InlineToolbar({ top, left, onBold, onItalic, onStrikethrough, onHighlight, onCode, onLink, onHeading, onQuote, onList, onTask, onMermaid, onMath, onClose }: InlineToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showHeading, setShowHeading] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const headingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleHeadingEnter = useCallback(() => {
    if (headingTimerRef.current) clearTimeout(headingTimerRef.current)
    setShowHeading(true)
  }, [])

  const handleHeadingLeave = useCallback(() => {
    headingTimerRef.current = setTimeout(() => {
      setShowHeading(false)
    }, 200)
  }, [])

  useEffect(() => {
    return () => { if (headingTimerRef.current) clearTimeout(headingTimerRef.current) }
  }, [])

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      onLink(linkUrl.trim())
    }
    setLinkUrl('')
    setShowLinkInput(false)
  }

  return (
    <div
      className="fixed z-[100] flex items-center gap-0.5 bg-white dark:bg-[#2c2c2e] rounded-lg shadow-xl dark:shadow-[#00000033] border border-[#e5e5e5] dark:border-[#38383a] px-1 py-1"
      style={{ top: `${top}px`, left: `${left}px` }}
    >
      <div className="relative"
        onMouseEnter={handleHeadingEnter}
        onMouseLeave={handleHeadingLeave}
      >
        <button
          className="w-7 h-7 flex items-center justify-center text-sm text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
          title="标题"
        >
          <Type size={14} />
        </button>
        {showHeading && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#2c2c2e] rounded-lg shadow-xl border border-[#e5e5e5] dark:border-[#38383a] py-1 min-w-[150px]">
            {HEADING_ENTRIES.map(h => (
              <button
                key={h.level}
                className="w-full px-3 py-1.5 text-xs text-left text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] flex items-center gap-2 transition-colors"
                onClick={() => { if (headingTimerRef.current) clearTimeout(headingTimerRef.current); onHeading(h.level); onClose(); setShowHeading(false) }}
              >
                <span className="font-mono text-[#86868f] w-6">{h.shortcut}</span>
                <span>{h.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-[#e5e5e5] dark:bg-[#38383a] mx-0.5" />

      <button
        onClick={() => { onBold(); onClose() }}
        className="w-7 h-7 flex items-center justify-center text-sm font-bold text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
        title="加粗"
      >
        <Bold size={14} />
      </button>
      <button
        onClick={() => { onItalic(); onClose() }}
        className="w-7 h-7 flex items-center justify-center text-sm italic text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
        title="斜体"
      >
        <Italic size={14} />
      </button>
      <button
        onClick={() => { onStrikethrough(); onClose() }}
        className="w-7 h-7 flex items-center justify-center text-sm text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
        title="删除线"
      >
        <Strikethrough size={14} />
      </button>
      <button
        onClick={() => { onHighlight(); onClose() }}
        className="w-7 h-7 flex items-center justify-center text-sm text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
        title="高亮"
      >
        <Highlighter size={14} />
      </button>
      <button
        onClick={() => { onCode(); onClose() }}
        className="w-7 h-7 flex items-center justify-center text-sm text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
        title="代码"
      >
        <Code size={14} />
      </button>

      <div className="w-px h-5 bg-[#e5e5e5] dark:bg-[#38383a] mx-0.5" />

      {showLinkInput ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleLinkSubmit() }}
          className="flex items-center gap-1"
        >
          <input
            autoFocus
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="输入 URL..."
            className="w-32 h-7 px-2 text-xs bg-white dark:bg-[#1c1c1e] border border-[#e5e5e5] dark:border-[#38383a] rounded outline-none text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#aeaeb2] focus:border-[#007aff] dark:focus:border-[#0a84ff]"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowLinkInput(false)
              }
            }}
          />
          <button
            type="submit"
            className="w-7 h-7 flex items-center justify-center text-white bg-[#007aff] dark:bg-[#0a84ff] rounded hover:bg-blue-600 transition-colors"
          >
            <Check size={14} />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowLinkInput(true)}
          className="w-7 h-7 flex items-center justify-center text-sm text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
          title="链接"
        >
          <Link2 size={14} />
        </button>
      )}

      <div className="w-px h-5 bg-[#e5e5e5] dark:bg-[#38383a] mx-0.5" />

      <button
        onClick={() => { onQuote(); onClose() }}
        className="w-7 h-7 flex items-center justify-center text-sm text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
        title="引用"
      >
        <Quote size={14} />
      </button>
      <button
        onClick={() => { onList(); onClose() }}
        className="w-7 h-7 flex items-center justify-center text-sm text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
        title="无序列表"
      >
        <List size={14} />
      </button>
      <button
        onClick={() => { onTask(); onClose() }}
        className="w-7 h-7 flex items-center justify-center text-sm text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
        title="任务列表"
      >
        <CheckSquare size={14} />
      </button>

      {onMermaid && onMath && (
        <div className="w-px h-5 bg-[#e5e5e5] dark:bg-[#38383a] mx-0.5" />
      )}
      {onMermaid && (
        <button
          onClick={() => { onMermaid(); onClose() }}
          className="w-7 h-7 flex items-center justify-center text-sm text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
          title="Mermaid 图表"
        >
          <PieChart size={14} />
        </button>
      )}
      {onMath && (
        <button
          onClick={() => { onMath(); onClose() }}
          className="w-7 h-7 flex items-center justify-center text-sm text-[#86868f] dark:text-[#98989d] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
          title="数学公式"
        >
          <Sigma size={14} />
        </button>
      )}
    </div>
  )
}

export default InlineToolbar
