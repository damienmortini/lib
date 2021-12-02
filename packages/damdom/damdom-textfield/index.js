export default class DamdomTextFieldElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled']
  }

  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-flex;
        }
        textarea {
          flex: 1;
          resize: vertical;
          width: 100%;
        }
      </style>
      <textarea rows="1"></textarea>
    `

    this._textarea = this.shadowRoot.querySelector('textarea')
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        this.value = newValue
        break
      case 'disabled':
        this._textarea.disabled = this.disabled
        break
    }
  }

  get disabled() {
    return this.hasAttribute('disabled')
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '')
    } else {
      this.removeAttribute('disabled')
    }
  }

  get value() {
    return this._textarea.value
  }

  set value(value) {
    this._textarea.value = value
  }
}

window.customElements.define('damdom-textfield', DamdomTextFieldElement)
