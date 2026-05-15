import { WidgetType } from '@codemirror/view'
import mermaid from 'mermaid'

let lastTheme: string | null = null

function ensureTheme(dark: boolean) {
  const theme = dark ? 'dark' : 'default'
  if (lastTheme === theme) return
  lastTheme = theme
  mermaid.initialize({ startOnLoad: false, theme })
}

export class MermaidWidget extends WidgetType {
  private static idCounter = 0

  constructor(
    readonly code: string,
    readonly darkMode: boolean,
  ) {
    super()
  }

  eq(other: MermaidWidget) {
    return other.code === this.code && other.darkMode === this.darkMode
  }

  toDOM(): HTMLElement {
    ensureTheme(this.darkMode)

    const container = document.createElement('div')
    container.className = 'cm-mermaid-widget'

    const loading = document.createElement('div')
    loading.className = 'mermaid-loading'
    loading.textContent = '正在渲染...'
    container.appendChild(loading)

    const id = `mermaid-${++MermaidWidget.idCounter}`
    ;(async () => {
      try {
        const { svg } = await mermaid.render(id, this.code, container)
        if (!container.isConnected) return
        container.innerHTML = svg
        const hint = document.createElement('div')
        hint.className = 'mermaid-edit-hint'
        hint.textContent = '双击编辑'
        container.appendChild(hint)
      } catch (e) {
        if (!container.isConnected) return
        loading.textContent = '图表渲染失败'
        loading.className = 'mermaid-error'
      }
    })()

    return container
  }

  ignoreEvent(): boolean {
    return false
  }
}
