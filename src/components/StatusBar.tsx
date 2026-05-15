import { Check, Pencil } from 'lucide-react'

interface StatusBarProps {
  wordCount: number
  cursorLine: number
  cursorCol: number
  isModified: boolean
  hasContent: boolean
}

function StatusBar({ wordCount, cursorLine, cursorCol, isModified, hasContent }: StatusBarProps) {
  return (
    <div className="h-7 bg-[#f5f5f7] dark:bg-[#1c1c1e] border-t border-[#e5e5e5] dark:border-[#38383a] flex items-center px-4 text-xs text-[#86868f] dark:text-[#98989d] select-none flex-shrink-0">
      <div className="flex items-center gap-4">
        {hasContent && (
          <span>{wordCount} 字</span>
        )}
        {hasContent && (
          <span>行 {cursorLine}，列 {cursorCol}</span>
        )}
      </div>
      <div className="flex-1" />
      {hasContent && (
        <span className={`flex items-center gap-1 ${isModified ? 'text-[#febc2e]' : 'text-[#28c840]'}`}>
          {isModified ? <Pencil size={10} /> : <Check size={10} />}
          <span>{isModified ? '未保存' : '已保存'}</span>
        </span>
      )}
    </div>
  )
}

export default StatusBar
