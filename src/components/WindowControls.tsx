import { useState, useEffect } from 'react'

function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI?.windowIsMaximized().then(setIsMaximized)
    const cleanup = window.electronAPI?.onMaximizeChange((maximized) => {
      setIsMaximized(maximized)
    })
    return () => cleanup?.()
  }, [])

  return (
    <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      <button
        onClick={() => window.electronAPI?.windowMinimize()}
        className="w-11 h-full flex items-center justify-center text-[#86868f] dark:text-[#636366] hover:bg-[#e5e5e5] dark:hover:bg-[#2c2c2e] active:bg-[#d5d5d7] dark:active:bg-[#3a3a3c] transition-colors"
        title="最小化"
      >
        <svg width="10" height="1" viewBox="0 0 10 1">
          <rect width="10" height="1" fill="currentColor" />
        </svg>
      </button>
      <button
        onClick={() => window.electronAPI?.windowMaximize()}
        className="w-11 h-full flex items-center justify-center text-[#86868f] dark:text-[#636366] hover:bg-[#e5e5e5] dark:hover:bg-[#2c2c2e] active:bg-[#d5d5d7] dark:active:bg-[#3a3a3c] transition-colors"
        title={isMaximized ? '还原' : '最大化'}
      >
        {isMaximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="2" y="0.5" width="7.5" height="7.5" rx="1" />
            <rect x="0.5" y="2" width="7.5" height="7.5" rx="1" fill="currentColor" className="text-[#f5f5f7] dark:text-[#1c1c1e]" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="0.5" y="0.5" width="9" height="9" rx="1" />
          </svg>
        )}
      </button>
      <button
        onClick={() => window.electronAPI?.windowClose()}
        className="w-11 h-full flex items-center justify-center text-[#86868f] dark:text-[#636366] hover:bg-[#e81123] hover:text-white active:bg-[#bf0f1d] transition-colors"
        title="关闭"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 1L9 9M9 1L1 9" />
        </svg>
      </button>
    </div>
  )
}

export default WindowControls
