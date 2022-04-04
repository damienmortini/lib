import css from './index.css' assert { type: 'css' }

export class TemplateElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [css]
    this.shadowRoot.innerHTML = `
      <h1>template title</h1>
    `
  }
}

customElements.define('template-element', TemplateElement)
