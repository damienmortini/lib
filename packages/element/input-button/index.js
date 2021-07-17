export default class InputButtonElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled']
  }

  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-flex;
          min-width: 20px;
          min-height: 20px;
        }
        button {
          cursor: pointer;
          flex: 1;
          resize: vertical;
          width: 100%;
          height: 100%;
          outline: inherit;
        }
      </style>
      <button><slot></slot></button>
    `

    this._input = this.shadowRoot.querySelector('button')
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        try {
          this.value = new Function(`return ${newValue}`).apply(this)
        } catch (error) {
          this.value = newValue
        }
        break
      case 'disabled':
        this._input.disabled = this.disabled
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
    return this._value
  }

  set value(value) {
    this._value = value
    this.dispatchEvent(new Event('input', {
      bubbles: true,
    }))
  }
}
