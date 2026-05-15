import { forwardRef, useImperativeHandle, useEffect, useRef, useState, useCallback } from 'react'
import { EditorView, keymap, lineNumbers, Decoration, DecorationSet } from '@codemirror/view'
import { EditorState, StateField, StateEffect, RangeSetBuilder, Compartment } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { defaultKeymap, indentWithTab, undo, redo, history } from '@codemirror/commands'
import { closeBrackets } from '@codemirror/autocomplete'
import { syntaxHighlighting, HighlightStyle, syntaxTree } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { MermaidWidget } from './MermaidWidget'
import { MathWidget } from './MathWidget'
import InlineToolbar from './InlineToolbar'
import type { EditorSettings } from './SettingsPanel'

export interface EditorHandle {
  getContent: () => string
  setContent: (content: string) => void
  clear: () => void
  getModified: () => boolean
  resetModified: () => void
  getFilePath: () => string | null
  newFile: () => Promise<void>
  openFile: () => Promise<void>
  saveFile: () => Promise<void>
  saveAs: () => Promise<void>
  undo: () => void
  redo: () => void
  focus: () => void
  getCursorPosition: () => { line: number; col: number }
  getWordCount: () => number
  isEmpty: () => boolean
  formatInline: (type: 'bold' | 'italic' | 'strikethrough' | 'highlight' | 'code' | 'link' | 'image', url?: string) => void
  insertBlock: (type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'quote' | 'codeblock' | 'ul' | 'ol' | 'task' | 'hr' | 'table') => void
  insertText: (text: string) => void
}

interface EditorProps {
  darkMode?: boolean
  settings?: EditorSettings
  linkedFolderPath?: string | null
  onContentChange?: (content: string) => void
  onModifiedChange?: (modified: boolean) => void
  onFilePathChange?: (path: string | null) => void
  onCursorChange?: (line: number, col: number) => void
  onWordCountChange?: (count: number) => void
}

const createHighlight = (c: { heading: string; heading6: string; link: string; quote: string; list: string; hr: string; muted: string; strong?: string }) =>
  HighlightStyle.define([
    { tag: tags.heading1, class: 'cm-h cm-h1', color: c.heading },
    { tag: tags.heading2, class: 'cm-h cm-h2', color: c.heading },
    { tag: tags.heading3, class: 'cm-h cm-h3', color: c.heading },
    { tag: tags.heading4, class: 'cm-h cm-h4', color: c.heading },
    { tag: tags.heading5, class: 'cm-h cm-h5', color: c.heading },
    { tag: tags.heading6, class: 'cm-h cm-h6', color: c.heading6 },
    { tag: tags.strong, fontWeight: '700', ...(c.strong ? { color: c.strong } : {}) },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
    { tag: tags.link, color: c.link, textDecoration: 'underline', cursor: 'pointer' },
    { tag: tags.url, color: c.link, textDecoration: 'underline' },
    { tag: tags.monospace, class: 'cm-inline-code' },
    { tag: tags.quote, fontStyle: 'italic', color: c.quote },
    { tag: tags.list, color: c.list },
    { tag: tags.contentSeparator, class: 'cm-hr', color: c.hr },
    { tag: tags.processingInstruction, display: 'none' },
    { tag: tags.comment, color: c.muted },
    { tag: tags.meta, color: c.muted },
  ])

const wysiwygHighlight = createHighlight({
  heading: '#1d1d1f', heading6: '#86868f', link: '#007aff',
  quote: '#86868f', list: '#1d1d1f', hr: '#e5e5e5', muted: '#86868f',
})

const darkHighlight = createHighlight({
  heading: '#f5f5f7', heading6: '#98989d', link: '#0a84ff',
  quote: '#98989d', list: '#f5f5f7', hr: '#38383a', muted: '#98989d',
  strong: '#f5f5f7',
})

type ThemePalette = {
  bg: string; caret: string; selection: string
  gutterBg: string; gutterBorder: string; gutterText: string; activeGutter: string
  hr: string; tableBorder: string; thBg: string; codeBg: string
  contentColor?: string; tableColor?: string
  fontSize?: number
  showLineNumbers?: boolean
  lineWrapping?: boolean
}

function createTheme(p: ThemePalette) {
  const fontSize = p.fontSize || 18
  return EditorView.theme({
    '&': { backgroundColor: p.bg, fontSize: `${fontSize}px`, height: '100%' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': {
      fontFamily: "-apple-system, 'Segoe UI', 'Inter', 'SF Pro Text', Roboto, Helvetica, Arial, sans-serif",
      overflow: 'auto', lineHeight: '2.0',
      ...(p.lineWrapping ? { overflowWrap: 'break-word', wordBreak: 'break-word' } : {}),
    },
    '.cm-content': {
      padding: '48px 64px', caretColor: p.caret,
      fontFamily: "-apple-system, 'Segoe UI', 'Inter', 'SF Pro Text', Roboto, Helvetica, Arial, sans-serif",
      ...(p.contentColor ? { color: p.contentColor } : {}),
    },
    '.cm-cursor': { borderLeftColor: p.caret, borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: `${p.selection} !important` },
    '.cm-selectionBackground': { backgroundColor: `${p.selection} !important` },
    '.cm-gutters': {
      backgroundColor: p.gutterBg, borderRight: `1px solid ${p.gutterBorder}`, color: p.gutterText,
      ...(p.showLineNumbers === false ? { display: 'none' } : {}),
    },
    '.cm-lineNumbers': { color: p.gutterText },
    '.cm-lineNumbers .cm-gutterElement': {
      color: p.gutterText, padding: '0 4px 0 16px', fontSize: `${Math.max(12, fontSize - 3)}px`,
      fontFamily: "-apple-system, 'Segoe UI', 'Inter', 'SF Pro Text', monospace",
    },
    '.cm-activeLineGutter': { backgroundColor: p.activeGutter },
    '.cm-activeLine': { backgroundColor: 'transparent' },
    '.cm-hr': { display: 'block', borderTop: `1px solid ${p.hr}`, margin: '16px 0', textAlign: 'center', lineHeight: '0' },
    '.cm-hr::after': { content: '" "', display: 'inline-block' },
    'table': { borderCollapse: 'collapse', margin: '12px 0', width: '100%' },
    'th, td': {
      border: `1px solid ${p.tableBorder}`, padding: '8px 12px', textAlign: 'left', fontSize: `${Math.max(12, fontSize - 3)}px`,
      ...(p.tableColor ? { color: p.tableColor } : {}),
    },
    'th': { backgroundColor: p.thBg, fontWeight: '600' },
    '.cm-blockcode': {
      background: p.codeBg, borderRadius: '6px', padding: '16px', margin: '8px 0',
      fontFamily: "'SF Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
      fontSize: `${Math.max(12, fontSize - 3)}px`, lineHeight: '1.5', overflow: 'auto',
    },
    '.cm-blockcode .cm-inline-code': { background: 'transparent', padding: '0' },
    '.cm-formatting-hide': { display: 'none' },
    '.cm-manual-highlight': {
      backgroundColor: '#ffeb3b',
      color: '#1d1d1f',
      padding: '0 2px',
      borderRadius: '2px',
    },
    '.cm-title-line': {
      fontSize: `${fontSize + 6}px`,
      fontWeight: '700',
      textAlign: 'center',
      paddingBottom: '16px',
      marginBottom: '16px',
      borderBottom: `1px solid ${p.hr}`,
      lineHeight: '1.4',
    },
  })
}

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

const lightPalette: ThemePalette = {
  bg: '#ffffff', caret: '#007aff', selection: 'rgba(0, 122, 255, 0.2)',
  gutterBg: '#ffffff', gutterBorder: '#e5e5e5', gutterText: '#86868f', activeGutter: '#f5f5f7',
  hr: '#e5e5e5', tableBorder: '#e5e5e5', thBg: '#f5f5f7', codeBg: '#f5f5f7',
  fontSize: 18, showLineNumbers: true, lineWrapping: true,
}

const darkPalette: ThemePalette = {
  bg: '#1c1c1e', caret: '#0a84ff', selection: 'rgba(10, 132, 255, 0.3)',
  gutterBg: '#1c1c1e', gutterBorder: '#38383a', gutterText: '#98989d', activeGutter: '#2c2c2e',
  hr: '#38383a', tableBorder: '#38383a', thBg: '#2c2c2e', codeBg: '#2c2c2e',
  contentColor: '#f5f5f7', tableColor: '#f5f5f7',
  fontSize: 18, showLineNumbers: true, lineWrapping: true,
}

const darkModeEffect = StateEffect.define<boolean>()
const darkModeField = StateField.define<boolean>({
  create: () => false,
  update: (value, tr) => {
    for (const e of tr.effects) if (e.is(darkModeEffect)) return e.value
    return value
  },
})

const hideDeco = Decoration.mark({ class: 'cm-formatting-hide' })
const boldDeco = Decoration.mark({ class: 'cm-manual-strong' })
const italicDeco = Decoration.mark({ class: 'cm-manual-em' })
const strikeDeco = Decoration.mark({ class: 'cm-manual-strikethrough' })
const codeDeco = Decoration.mark({ class: 'cm-manual-code' })

const emphasisRegexps = [
  { re: /\*\*(.+?)\*\*/g, markerLen: 2, deco: boldDeco },
  { re: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, markerLen: 1, deco: italicDeco },
  { re: /~~(.+?)~~/g, markerLen: 2, deco: strikeDeco },
  { re: /`(.+?)`/g, markerLen: 1, deco: codeDeco },
]

function computeManualEmphasis(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const docStr = state.doc.toString()
  if (docStr.length < 2 || (!docStr.includes('*') && !docStr.includes('~') && !docStr.includes('`') && !docStr.includes('='))) return builder.finish()

  for (const { re, markerLen, deco } of emphasisRegexps) {
    re.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = re.exec(docStr)) !== null) {
      const start = match.index
      const innerStart = start + markerLen
      const innerEnd = match.index + match[0].length - markerLen
      const end = match.index + match[0].length

      if (innerEnd <= innerStart) continue

      builder.add(start, innerStart, hideDeco)
      builder.add(innerStart, innerEnd, deco)
      builder.add(innerEnd, end, hideDeco)
    }
  }

  return builder.finish()
}

const firstLineDeco = Decoration.line({ class: 'cm-title-line' })

function computeFirstLineTitle(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  if (state.doc.lines > 0) {
    const line = state.doc.line(1)
    if (line.text.trim().length > 0) {
      builder.add(line.from, line.from, firstLineDeco)
    }
  }
  return builder.finish()
}

function computeHighlightDecorations(state: EditorState): DecorationSet {
  const docStr = state.doc.toString()
  if (!docStr.includes('==')) return Decoration.none
  const ranges: { from: number; to: number; value: Decoration }[] = []
  const regex = /==(.+?)==/g
  regex.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(docStr)) !== null) {
    const start = match.index
    const innerStart = start + 2
    const innerEnd = start + match[0].length - 2
    const end = start + match[0].length
    if (innerEnd <= innerStart) continue
    ranges.push({ from: start, to: innerStart, value: Decoration.mark({ class: 'cm-formatting-hide' }) })
    ranges.push({ from: innerStart, to: innerEnd, value: Decoration.mark({ class: 'cm-manual-highlight' }) })
    ranges.push({ from: innerEnd, to: end, value: Decoration.mark({ class: 'cm-formatting-hide' }) })
  }
  ranges.sort((a, b) => a.from - b.from || a.to - b.to)
  return Decoration.set(ranges.map(r => r.value.range(r.from, r.to)), false)
}

function computeMermaidDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const docStr = state.doc.toString()
  if (!docStr.includes('```mermaid')) return builder.finish()
  const cursor = state.selection.main.head
  const doc = state.doc

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    if (line.text.trim() !== '```mermaid') continue
    const blockStart = line.from
    let closingLine = 0
    const codeLines: string[] = []
    for (let j = i + 1; j <= doc.lines; j++) {
      const l = doc.line(j)
      if (l.text.trim() === '```') { closingLine = j; break }
      codeLines.push(l.text)
    }
    if (!closingLine) continue
    const code = codeLines.join('\n')
    const blockEnd = doc.line(closingLine).to
    const codeStart = line.to
    const codeEnd = doc.line(closingLine).from
    const cursorInCode = cursor > codeStart && cursor < codeEnd
    if (!cursorInCode && code.trim()) {
      builder.add(blockStart, blockEnd, Decoration.replace({
        widget: new MermaidWidget(code.trim(), state.field(darkModeField, false)!),
        block: true,
      }))
    }
    i = closingLine
  }
  return builder.finish()
}

function computeMathDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const docStr = state.doc.toString()
  if (!docStr.includes('$')) return builder.finish()
  const cursor = state.selection.main.head

  const blockRegex = /\$\$([\s\S]*?)\$\$/g
  let match: RegExpExecArray | null
  while ((match = blockRegex.exec(docStr)) !== null) {
    const start = match.index
    const end = start + match[0].length
    if (cursor > start + 2 && cursor < end - 2) continue
    const expr = match[1].trim()
    if (!expr) continue
    builder.add(start, end, Decoration.replace({
      widget: new MathWidget(expr, true),
      block: true,
    }))
  }

  const inlineRegex = /(?<=^|[^$\d\w])\$([^$\n]+?)\$(?=[^$\d\w]|$)/g
  while ((match = inlineRegex.exec(docStr)) !== null) {
    const start = match.index
    const end = start + match[0].length
    if (cursor > start && cursor < end) continue
    const expr = match[1]
    if (!expr.trim()) continue
    builder.add(start, end, Decoration.replace({
      widget: new MathWidget(expr.trim(), false),
    }))
  }
  return builder.finish()
}

function combineDecorations(state: EditorState): DecorationSet {
  const all: { from: number; to: number; value: Decoration }[] = []

  const add = (set: DecorationSet) => {
    try {
      set.between(0, state.doc.length, (from, to, value) => {
        all.push({ from, to, value })
      })
    } catch (e) { console.error('deco error:', e) }
  }

  add(computeMermaidDecorations(state))
  add(computeMathDecorations(state))
  add(computeManualEmphasis(state))
  add(computeHighlightDecorations(state))
  add(computeFirstLineTitle(state))

  all.sort((a, b) => a.from - b.from || a.to - b.to)
  return Decoration.set(all.map(r => r.value.range(r.from, r.to)))
}

const wysiwygField = StateField.define<DecorationSet>({
  create(state) { return combineDecorations(state) },
  update(_deco, tr) { return combineDecorations(tr.state) },
  provide: f => EditorView.decorations.from(f),
})

const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { darkMode, settings, linkedFolderPath, onContentChange, onModifiedChange, onFilePathChange, onCursorChange, onWordCountChange },
  ref,
) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const modifiedRef = useRef(false)
  const suppressModifiedRef = useRef(false)
  const filePathRef = useRef<string | null>(null)
  const themeCompartmentRef = useRef(new Compartment())
  const highlightCompartmentRef = useRef(new Compartment())
  const settingsCompartmentRef = useRef(new Compartment())
  const wordCountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onContentChangeRef = useRef(onContentChange)
  const onModifiedChangeRef = useRef(onModifiedChange)
  const onFilePathChangeRef = useRef(onFilePathChange)
  const onCursorChangeRef = useRef(onCursorChange)
  const onWordCountChangeRef = useRef(onWordCountChange)
  const [inlineToolbar, setInlineToolbar] = useState<{ top: number; left: number } | null>(null)
  const [showTitleHint, setShowTitleHint] = useState(true)

  onContentChangeRef.current = onContentChange
  onModifiedChangeRef.current = onModifiedChange
  onFilePathChangeRef.current = onFilePathChange
  onCursorChangeRef.current = onCursorChange
  onWordCountChangeRef.current = onWordCountChange

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setInlineToolbar(null)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInlineToolbar(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!editorRef.current) return

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (!file) return
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            const view = viewRef.current
            if (!view) return
            const pos = view.state.selection.main.head
            view.dispatch({
              changes: { from: pos, to: pos, insert: `![${file.name}](${dataUrl})` },
              selection: { anchor: pos + file.name.length + 2, head: pos + file.name.length + 2 },
            })
            view.focus()
          }
          reader.readAsDataURL(file)
          break
        }
      }
    }

    const handleDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          e.preventDefault()
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            const view = viewRef.current
            if (!view) return
            const pos = view.posAtCoords({ x: e.clientX, y: e.clientY })
            if (pos == null) return
            view.dispatch({
              changes: { from: pos, to: pos, insert: `![${file.name}](${dataUrl})` },
              selection: { anchor: pos + file.name.length + 2 },
            })
            view.focus()
          }
          reader.readAsDataURL(file)
          break
        }
      }
    }

    const palette = darkMode ? darkPalette : lightPalette
    const s = settings || { fontSize: 18, showLineNumbers: true, lineWrapping: true, editorWidth: 800, autoSave: true, autoSaveInterval: 30 }
    const settingsTheme = createTheme({
      bg: palette.bg, caret: palette.caret, selection: palette.selection,
      gutterBg: palette.gutterBg, gutterBorder: palette.gutterBorder,
      gutterText: palette.gutterText, activeGutter: palette.activeGutter,
      hr: palette.hr, tableBorder: palette.tableBorder, thBg: palette.thBg,
      codeBg: palette.codeBg, contentColor: palette.contentColor,
      tableColor: palette.tableColor,
      fontSize: s.fontSize,
      showLineNumbers: s.showLineNumbers,
      lineWrapping: s.lineWrapping,
    })

    const view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          lineNumbers(),
          history(),
          s.lineWrapping ? EditorView.lineWrapping : [],
          keymap.of([...defaultKeymap, indentWithTab]),
          markdown({ base: markdownLanguage }),
          closeBrackets(),
          highlightCompartmentRef.current.of(syntaxHighlighting(wysiwygHighlight, { fallback: true })),
          themeCompartmentRef.current.of(settingsTheme),
          settingsCompartmentRef.current.of(EditorView.theme({
            '.cm-content': { maxWidth: `${s.editorWidth}px`, margin: '0 auto' },
          })),
          wysiwygField,
          darkModeField,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              if (!suppressModifiedRef.current) {
                modifiedRef.current = true
                onModifiedChangeRef.current?.(true)
              }
              suppressModifiedRef.current = false
              const text = update.state.doc.toString()
              onContentChangeRef.current?.(text)
              if (wordCountTimerRef.current) clearTimeout(wordCountTimerRef.current)
              wordCountTimerRef.current = setTimeout(() => {
                onWordCountChangeRef.current?.(countWords(text))
              }, 300)
              setShowTitleHint(update.state.doc.line(1).text.trim().length === 0)
            }

            const sel = update.state.selection.main
            const pos = sel.head
            const line = update.state.doc.lineAt(pos)
            const col = pos - line.from + 1
            onCursorChangeRef.current?.(line.number, col)

            if (!sel.empty && update.view) {
              const coords = update.view.coordsAtPos(sel.from)
              if (coords) {
                let top = coords.top - 44
                let left = coords.left
                if (left < 0) left = 8
                if (left + 400 > window.innerWidth) left = window.innerWidth - 408
                if (top < 0) top = 4
                setInlineToolbar({ top, left })
              }
            } else if (!sel.empty === false) {
              setInlineToolbar(null)
            }
          }),
        ],
      }),
      parent: editorRef.current,
    })

    viewRef.current = view

    const editorDom = editorRef.current
    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const widget = target.closest('.cm-mermaid-widget, .cm-math-widget')
      if (!widget || !viewRef.current) return
      const pos = viewRef.current.posAtDOM(widget)
      if (pos != null) {
        viewRef.current.dispatch({
          selection: { anchor: pos, head: pos },
          scrollIntoView: true,
        })
        viewRef.current.focus()
      }
    }
    const handleBlankClick = (e: MouseEvent) => {
      const view = viewRef.current
      if (!view) return
      const doc = view.state.doc
      const endCoords = view.coordsAtPos(doc.length)
      if (!endCoords || e.clientY <= endCoords.bottom + 3) return
      if (doc.length > 0 && doc.sliceString(doc.length - 1, doc.length) !== '\n') {
        view.dispatch({
          changes: { from: doc.length, to: doc.length, insert: '\n' },
          selection: { anchor: doc.length + 1, head: doc.length + 1 },
        })
      } else {
        view.dispatch({
          selection: { anchor: doc.length, head: doc.length },
        })
      }
      view.focus()
    }
    editorDom.addEventListener('dblclick', handleDoubleClick)
    editorDom.addEventListener('mousedown', handleBlankClick)
    editorDom.addEventListener('paste', handlePaste)
    editorDom.addEventListener('drop', handleDrop)

    return () => {
      view.destroy()
      viewRef.current = null
      editorDom.removeEventListener('dblclick', handleDoubleClick)
      editorDom.removeEventListener('mousedown', handleBlankClick)
      editorDom.removeEventListener('paste', handlePaste)
      editorDom.removeEventListener('drop', handleDrop)
    }
  }, [])

  const commitSave = async () => {
    const view = viewRef.current
    if (!view) return
    const content = view.state.doc.toString()
    const firstLine = content.split('\n')[0]?.replace(/^#+\s*/, '').trim().replace(/[<>:"/\\|?*]/g, '') || ''
    const defaultName = firstLine ? `${firstLine.substring(0, 60)}.md` : undefined

    let fp = filePathRef.current
    if (!fp && linkedFolderPath && defaultName) {
      const now = new Date()
      const monthDir = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月`
      const dir = `${linkedFolderPath}/${monthDir}`
      await window.electronAPI?.makeDirectory(dir)
      fp = `${dir}/${defaultName}`
    }
    fp = fp ?? (await window.electronAPI?.saveFileDialog(defaultName)) ?? null
    if (!fp) return

    await window.electronAPI?.writeFile(fp, content)
    filePathRef.current = fp
    onFilePathChangeRef.current?.(fp)
    modifiedRef.current = false
    onModifiedChangeRef.current?.(false)
  }

  const checkUnsaved = async (): Promise<'save' | 'discard' | 'cancel'> => {
    if (!modifiedRef.current) return 'discard'
    const action = (await window.electronAPI?.showUnsavedDialog()) ?? 'discard'
    if (action === 'save') await commitSave()
    return action
  }

  const insertInline = useCallback((type: 'bold' | 'italic' | 'strikethrough' | 'highlight' | 'code' | 'link' | 'image', url?: string) => {
    const view = viewRef.current
    if (!view) return

    if (type === 'link' || type === 'image') {
      const sel = view.state.selection.main
      const hasSelection = !sel.empty
      const text = hasSelection ? view.state.sliceDoc(sel.from, sel.to) : ''
      const pos = sel.head

      if (type === 'image') {
        const alt = text || '图片'
        view.dispatch({
          changes: { from: pos, to: pos, insert: `![${alt}](${url || 'url'})` },
          selection: { anchor: pos },
        })
      } else {
        const linkText = hasSelection ? text : '链接'
        view.dispatch({
          changes: { from: sel.from, to: sel.to, insert: `[${linkText}](${url || 'url'})` },
          selection: { anchor: sel.from + 1 },
        })
      }
      view.focus()
      return
    }

    const wrapperMap: Record<string, string> = {
      bold: '**',
      italic: '*',
      strikethrough: '~~',
      highlight: '==',
      code: '`',
    }
    const nodeMap: Record<string, string> = {
      StrongEmphasis: '**',
      Emphasis: '*',
      Strikethrough: '~~',
      Highlight: '==',
      InlineCode: '`',
    }

    const wrapper = wrapperMap[type]
    const sel = view.state.selection.main
    const hasSelection = !sel.empty
    const doc = view.state.doc.toString()

    // Try to find existing formatting via syntax tree
    const tree = syntaxTree(view.state)
    const cursor = tree.cursorAt(sel.from, 0)
    do {
      if (cursor.name in nodeMap && nodeMap[cursor.name] === wrapper) {
        const innerText = view.state.sliceDoc(cursor.from + wrapper.length, cursor.to - wrapper.length)
        view.dispatch({
          changes: { from: cursor.from, to: cursor.to, insert: innerText },
          selection: { anchor: cursor.from + innerText.length },
        })
        view.focus()
        return
      }
    } while (cursor.name !== 'Document' && cursor.name !== 'Paragraph' && cursor.parent())

    // Fallback: check if selection boundaries align with markers
    if (hasSelection) {
      const wl = wrapper.length
      if (sel.from >= wl && sel.to + wl <= doc.length &&
          doc.slice(sel.from - wl, sel.from) === wrapper &&
          doc.slice(sel.to, sel.to + wl) === wrapper) {
        const innerText = view.state.sliceDoc(sel.from, sel.to)
        view.dispatch({
          changes: { from: sel.from - wl, to: sel.to + wl, insert: innerText },
          selection: { anchor: sel.from - wl + innerText.length },
        })
        view.focus()
        return
      }
    }

    // No existing formatting — wrap selection
    const text = hasSelection ? view.state.sliceDoc(sel.from, sel.to) : ''
    const wrapped = `${wrapper}${text}${wrapper}`

    if (hasSelection) {
      view.dispatch({
        changes: { from: sel.from, to: sel.to, insert: wrapped },
        selection: { anchor: sel.from + wrapper.length },
      })
    } else {
      view.dispatch({
        changes: { from: sel.head, to: sel.head, insert: wrapped },
        selection: { anchor: sel.head + wrapper.length },
      })
    }
    view.focus()
  }, [])

  const insertBlock = useCallback((type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'quote' | 'codeblock' | 'ul' | 'ol' | 'task' | 'hr' | 'table' | 'mermaid' | 'math') => {
    const view = viewRef.current
    if (!view) return

    const pos = view.state.selection.main.head
    const line = view.state.doc.lineAt(pos)
    const lineStart = line.from

    let insertion = ''

    switch (type) {
      case 'h1': insertion = `# `; break
      case 'h2': insertion = `## `; break
      case 'h3': insertion = `### `; break
      case 'h4': insertion = `#### `; break
      case 'h5': insertion = `##### `; break
      case 'h6': insertion = `###### `; break
      case 'quote': insertion = `> `; break
      case 'codeblock': insertion = '```\n\n```'; break
      case 'mermaid': insertion = '```mermaid\n\n```'; break
      case 'math': insertion = '$$\n\n$$'; break
      case 'ul': insertion = `- `; break
      case 'ol': insertion = `1. `; break
      case 'task': insertion = `- [ ] `; break
      case 'hr': insertion = `\n---\n`; break
      case 'table': insertion = '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n'; break
    }

    if (type === 'hr' || type === 'table') {
      view.dispatch({
        changes: { from: pos, to: pos, insert: insertion },
        selection: { anchor: pos + insertion.length },
      })
    } else if (type === 'codeblock' || type === 'mermaid' || type === 'math') {
      view.dispatch({
        changes: { from: lineStart, to: lineStart, insert: insertion },
        selection: { anchor: lineStart + 3, head: lineStart + 3 },
      })
    } else {
      const existing = view.state.sliceDoc(lineStart, line.from + line.length)
      const markerRegex = /^(#{1,6}\s|>\s|- \[ \] |- |\d+\.\s)/
      const startsWithMarker = markerRegex.test(existing)
      if (startsWithMarker) {
        const currentMarker = existing.match(markerRegex)?.[0] ?? ''
        const lineContent = view.state.sliceDoc(lineStart, line.from + line.length)
        if (currentMarker === insertion) {
          const cleanContent = lineContent.replace(markerRegex, '')
          view.dispatch({
            changes: { from: lineStart, to: line.from + line.length, insert: cleanContent },
            selection: { anchor: lineStart },
          })
        } else {
          const newLine = insertion + lineContent.replace(markerRegex, '')
          view.dispatch({
            changes: { from: lineStart, to: line.from + line.length, insert: newLine },
            selection: { anchor: lineStart + insertion.length },
          })
        }
      } else {
        view.dispatch({
          changes: { from: lineStart, to: lineStart, insert: insertion },
          selection: { anchor: lineStart + insertion.length },
        })
      }
    }
    view.focus()
  }, [])

  useImperativeHandle(ref, () => ({
    getContent: () => viewRef.current?.state.doc.toString() ?? '',
    setContent: (content: string) => {
      const view = viewRef.current
      if (!view) return
      suppressModifiedRef.current = true
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      })
      modifiedRef.current = false
      onModifiedChangeRef.current?.(false)
    },
    clear: () => {
      const view = viewRef.current
      if (!view) return
      suppressModifiedRef.current = true
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: '' },
      })
      modifiedRef.current = false
      onModifiedChangeRef.current?.(false)
    },
    getModified: () => modifiedRef.current,
    resetModified: () => {
      modifiedRef.current = false
      onModifiedChangeRef.current?.(false)
    },
    getFilePath: () => filePathRef.current,
    getCursorPosition: () => {
      const view = viewRef.current
      if (!view) return { line: 1, col: 1 }
      const pos = view.state.selection.main.head
      const line = view.state.doc.lineAt(pos)
      return { line: line.number, col: pos - line.from + 1 }
    },
    getWordCount: () => {
      const view = viewRef.current
      if (!view) return 0
      return countWords(view.state.doc.toString())
    },
    isEmpty: () => {
      const view = viewRef.current
      if (!view) return true
      return view.state.doc.length === 0
    },
    newFile: async () => {
      const action = await checkUnsaved()
      if (action === 'cancel') return
      const view = viewRef.current
      if (!view) return
      suppressModifiedRef.current = true
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: '\n\n\n\n\n\n\n\n\n\n' },
      })
      modifiedRef.current = false
      onModifiedChangeRef.current?.(false)
      filePathRef.current = null
      onFilePathChangeRef.current?.(null)
    },
    openFile: async () => {
      const action = await checkUnsaved()
      if (action === 'cancel') return
      const result = await window.electronAPI?.openFileDialog()
      if (!result) return
      const view = viewRef.current
      if (!view) return
      suppressModifiedRef.current = true
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: result.content },
      })
      modifiedRef.current = false
      onModifiedChangeRef.current?.(false)
      filePathRef.current = result.filePath
      onFilePathChangeRef.current?.(result.filePath)
    },
    saveFile: async () => { await commitSave() },
    saveAs: async () => {
      const view = viewRef.current
      if (!view) return
      const content = view.state.doc.toString()
      const firstLine = content.split('\n')[0]?.replace(/^#+\s*/, '').trim().replace(/[<>:"/\\|?*]/g, '') || ''
      const defaultName = firstLine ? `${firstLine.substring(0, 60)}.md` : undefined
      const fp = (await window.electronAPI?.saveFileDialog(defaultName)) ?? null
      if (!fp) return
      await window.electronAPI?.writeFile(fp, content)
      filePathRef.current = fp
      onFilePathChangeRef.current?.(fp)
      modifiedRef.current = false
      onModifiedChangeRef.current?.(false)
    },
    undo: () => { if (viewRef.current) undo(viewRef.current) },
    redo: () => { if (viewRef.current) redo(viewRef.current) },
    focus: () => { viewRef.current?.focus() },
    formatInline: (type, url) => insertInline(type, url),
    insertBlock: (type) => insertBlock(type),
    insertText: (text) => {
      const view = viewRef.current
      if (!view) return
      try {
        const pos = view.state.selection.main.head
        view.dispatch({
          changes: { from: pos, to: pos, insert: text },
          selection: { anchor: pos + text.length },
        })
      } catch (e) {
        console.error('insertText error:', e)
      }
      view.focus()
    },
  }), [insertInline, insertBlock])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const s = settings || { fontSize: 18, showLineNumbers: true, lineWrapping: true, editorWidth: 800, autoSave: true, autoSaveInterval: 30 }
    const palette = darkMode ? darkPalette : lightPalette
    const settingsTheme = createTheme({
      bg: palette.bg, caret: palette.caret, selection: palette.selection,
      gutterBg: palette.gutterBg, gutterBorder: palette.gutterBorder,
      gutterText: palette.gutterText, activeGutter: palette.activeGutter,
      hr: palette.hr, tableBorder: palette.tableBorder, thBg: palette.thBg,
      codeBg: palette.codeBg, contentColor: palette.contentColor,
      tableColor: palette.tableColor,
      fontSize: s.fontSize,
      showLineNumbers: s.showLineNumbers,
      lineWrapping: s.lineWrapping,
    })
    view.dispatch({
      effects: [
        darkModeEffect.of(!!darkMode),
        themeCompartmentRef.current.reconfigure(settingsTheme),
        highlightCompartmentRef.current.reconfigure(
          syntaxHighlighting(darkMode ? darkHighlight : wysiwygHighlight, { fallback: true })
        ),
        settingsCompartmentRef.current.reconfigure(EditorView.theme({
          '.cm-content': { maxWidth: `${s.editorWidth}px`, margin: '0 auto' },
        })),
      ],
    })
  }, [darkMode, settings])

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <div ref={editorRef} className="h-full w-full" />
      {inlineToolbar && (
        <InlineToolbar
          top={inlineToolbar.top}
          left={inlineToolbar.left}
          onBold={() => insertInline('bold')}
          onItalic={() => insertInline('italic')}
          onStrikethrough={() => insertInline('strikethrough')}
          onHighlight={() => insertInline('highlight')}
          onCode={() => insertInline('code')}
          onLink={(url) => insertInline('link', url)}
          onHeading={(level) => insertBlock(level)}
          onQuote={() => insertBlock('quote')}
          onList={() => insertBlock('ul')}
          onTask={() => insertBlock('task')}
          onMermaid={() => insertBlock('mermaid')}
          onMath={() => insertBlock('math')}
          onClose={() => setInlineToolbar(null)}
        />
      )}
      {showTitleHint && (
        <div className="absolute top-0 left-0 right-0 pointer-events-none select-none z-10" style={{ padding: '48px 64px 0' }}>
          <span className="text-2xl font-bold tracking-wide block text-center text-black/10 dark:text-white/10">
            标题
          </span>
        </div>
      )}
    </div>
  )
})

export default Editor
