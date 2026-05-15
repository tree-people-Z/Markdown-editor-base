export interface FolderEntry {
  name: string
  path: string
  isDirectory: boolean
  preview?: string
}

export type InlineFormatType = 'bold' | 'italic' | 'strikethrough' | 'highlight' | 'code' | 'link' | 'image'

export type BlockFormatType =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'quote' | 'codeblock' | 'ul' | 'ol' | 'task' | 'hr' | 'table'
  | 'mermaid' | 'math'
