export class GraphPropertyNodeElement extends HTMLElement {
  #value
  #valueDisplay
  #idDisplay

  static get observedAttributes() {
    return ['id']
  }

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
      <span id="id"></span>: 
      <span id="value"></span>
    `
    this.#idDisplay = this.shadowRoot.querySelector('#id')
    this.#valueDisplay = this.shadowRoot.querySelector('#value')
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'id':
        this.#idDisplay.textContent = newValue
        break
    }
  }

  get value() {
    return this.#value
  }

  set value(value) {
    this.#value = value
    this.#valueDisplay.textContent = value
  }
}

window.customElements.define('damdom-propertynode', GraphPropertyNodeElement)
