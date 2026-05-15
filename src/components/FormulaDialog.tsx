import { useState } from 'react'
import { X } from 'lucide-react'

interface FormulaDialogProps {
  onInsert: (expression: string, displayMode: boolean) => void
  onClose: () => void
}

function FormulaDialog({ onInsert, onClose }: FormulaDialogProps) {
  const [expression, setExpression] = useState('')
  const [displayMode, setDisplayMode] = useState(false)

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-16 bg-black/20">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-2xl border border-[#e5e5e5] dark:border-[#38383a] min-w-[420px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] dark:border-[#38383a]">
          <span className="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">插入公式</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-[#86868f] hover:bg-[#e5e5e5] dark:hover:bg-[#3a3a3c] rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <textarea
            autoFocus
            value={expression}
            onChange={e => setExpression(e.target.value)}
            placeholder="输入 LaTeX 公式，例如: E = mc^2"
            className="w-full h-24 resize-none text-sm font-mono bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-[#e5e5e5] dark:border-[#38383a] rounded-lg p-3 outline-none text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#aeaeb2] focus:border-[#007aff] dark:focus:border-[#0a84ff] transition-colors leading-relaxed"
            spellCheck={false}
          />

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={displayMode}
              onChange={e => setDisplayMode(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#c7c7cc] dark:border-[#48484a] text-[#007aff] focus:ring-[#007aff]"
            />
            <span className="text-xs text-[#86868f] dark:text-[#98989d]">块级显示（居中单独一行）</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#e5e5e5] dark:border-[#38383a]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#e5e5e5] dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] hover:opacity-80 transition-opacity"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (expression.trim()) {
                onInsert(expression.trim(), displayMode)
              }
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#007aff] text-white hover:bg-[#0066d6] transition-colors"
          >
            插入
          </button>
        </div>
      </div>
    </div>
  )
}

export default FormulaDialog
