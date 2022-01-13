export class TemplateElement extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }
      </style>
      <h1>template title</h1>
    `
  }
}

customElements.define('template-element', TemplateElement)
