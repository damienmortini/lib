import css from './index.css' assert { type: 'css' }

export class TemplateElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [css]
    this.shadowRoot.innerHTML = `template title`
  }
}

customElements.define('template-element', TemplateElement)
