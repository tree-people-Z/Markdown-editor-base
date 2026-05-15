import { useState, useRef, useCallback, useEffect } from 'react'

interface EditableTitleProps {
  value: string
  onChange: (val: string) => void
  onCommit: (val: string) => void
}

function EditableTitle({ value, onChange, onCommit }: EditableTitleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    if (!editing) {
      setDraft(value)
    }
  }, [value, editing])

  const startEdit = useCallback(() => {
    setDraft(value)
    setEditing(true)
  }, [value])

  const commit = useCallback(() => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) {
      onCommit(trimmed)
    } else {
      setDraft(value)
      onChange(value)
    }
  }, [draft, value, onCommit, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      setEditing(false)
      setDraft(value)
      onChange(value)
    }
  }, [commit, value, onChange])

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={e => { setDraft(e.target.value); onChange(e.target.value) }}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="text-sm text-center text-[#1d1d1f] dark:text-[#f5f5f7] font-medium tracking-tight bg-transparent border-b border-[#007aff] dark:border-[#0a84ff] outline-none px-2 py-0.5 min-w-[80px] max-w-[400px]"
      />
    )
  }

  return (
    <span
      onClick={startEdit}
      className="text-sm text-[#1d1d1f] dark:text-[#f5f5f7] font-medium tracking-tight truncate cursor-pointer hover:text-[#007aff] dark:hover:text-[#0a84ff] transition-colors max-w-[400px]"
      title="点击编辑标题"
    >
      {value}
    </span>
  )
}

export default EditableTitle
