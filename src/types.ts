export interface FolderEntry {
  name: string
  path: string
  isDirectory: boolean
  preview?: string
}

export type InlineFormatType = 'bold' | 'italic' | 'strikethrough' | 'highlight' | 'code' | 'link' | 'image'

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export type BlockFormatType =
  | HeadingLevel
  | 'quote' | 'codeblock' | 'ul' | 'ol' | 'task' | 'hr' | 'table'
  | 'math'

export const HEADING_ENTRIES: { level: HeadingLevel; label: string; shortcut: string }[] = [
  { level: 'h1', label: 'Heading 1', shortcut: '#' },
  { level: 'h2', label: 'Heading 2', shortcut: '##' },
  { level: 'h3', label: 'Heading 3', shortcut: '###' },
  { level: 'h4', label: 'Heading 4', shortcut: '####' },
  { level: 'h5', label: 'Heading 5', shortcut: '#####' },
  { level: 'h6', label: 'Heading 6', shortcut: '######' },
]
