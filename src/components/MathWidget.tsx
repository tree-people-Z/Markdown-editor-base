import { WidgetType } from '@codemirror/view'
import katex from 'katex'

export class MathWidget extends WidgetType {
  constructor(
    readonly expression: string,
    readonly displayMode: boolean,
  ) {
    super()
  }

  eq(other: MathWidget) {
    return other.expression === this.expression && other.displayMode === this.displayMode
  }

  toDOM(): HTMLElement {
    const el = document.createElement(this.displayMode ? 'div' : 'span')
    el.className = 'cm-math-widget'
    if (this.displayMode) {
      el.style.textAlign = 'center'
      el.style.padding = '8px 0'
    }
    try {
      katex.render(this.expression, el, {
        displayMode: this.displayMode,
        throwOnError: false,
      })
    } catch {
      el.textContent = this.expression
    }
    return el
  }

  ignoreEvent(): boolean {
    return false
  }
}
