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
    <div className="flex items-center gap-2 select-none ml-3">
      <button
        onClick={() => window.electronAPI?.windowClose()}
        className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 transition-all duration-75 flex items-center justify-center group"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <svg className="w-2 h-2 text-[#4d1f1d] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 8 8">
          <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
      <button
        onClick={() => window.electronAPI?.windowMinimize()}
        className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 transition-all duration-75 flex items-center justify-center group"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <svg className="w-2 h-2 text-[#8a6d1a] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 8 8">
          <path d="M2 4H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
      <button
        onClick={() => window.electronAPI?.windowMaximize()}
        className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 transition-all duration-75 flex items-center justify-center group"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <svg className="w-2 h-2 text-[#1a6b24] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 8 8">
          {isMaximized ? (
            <path d="M2.5 5.5V6.5H6.5V2.5H5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ) : (
            <path d="M2 2L6 6M6 2L2 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          )}
        </svg>
      </button>
    </div>
  )
}

export default WindowControls
