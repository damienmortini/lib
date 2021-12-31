export class GraphPropertyNodeElement extends HTMLElement {
  #value
  #valueDisplay

  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          background: lightgrey;
          border-radius: 4px;
          padding: 5px 10px;
          box-sizing: border-box;
        }
      </style>
      <div id="value"></div>
    `

    this.#valueDisplay = this.shadowRoot.querySelector('#value')
  }

  get value() {
    return this.#value
  }

  set value(value) {
    this.#value = value
    this.#valueDisplay.textContent = value
  }
}

window.customElements.define('graph-propertynode', GraphPropertyNodeElement)
