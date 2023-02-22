import style from './index.css' assert { type: 'css' }

export class TemplateElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = [style]
    this.shadowRoot.innerHTML = `template title`
  }
}

customElements.define('template-element', TemplateElement)
