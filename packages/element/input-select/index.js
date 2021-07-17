export default class InputSelectElement extends HTMLElement {
  static get observedAttributes() {
    return ['options', 'value', 'disabled']
  }

  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        select {
          width: 100%;
        }
      </style>
      <select></select>
    `

    this._select = this.shadowRoot.querySelector('select')
    this._select.addEventListener('change', (event) => {
      event.stopPropagation()
      this.value = this._options[this._select.selectedIndex]
    })
    this._select.addEventListener('input', (event) => {
      event.stopPropagation()
      this.value = this._options[this._select.selectedIndex]
      this.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'options':
        this.options = new Function(`return ${newValue}`).apply(this)
        break
      case 'value':
        try {
          this.value = new Function(`return ${newValue}`).apply(this)
        } catch (error) {
          this.value = newValue
        }
        break
      case 'disabled':
        this._select.disabled = this.disabled
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

  get options() {
    return this._options
  }

  set options(value) {
    this._options = value
    this._select.innerHTML = ''
    for (const [index, option] of this._options.entries()) {
      const optionElement = document.createElement('option')
      optionElement.value = index
      optionElement.text = JSON.stringify(option)
      this._select.add(optionElement)
    }
    this._select.selectedIndex = this._options.indexOf(this.value)
  }

  get value() {
    return this._value
  }

  set value(value) {
    if (this._value === value) {
      return
    }
    this._select.selectedIndex = this._options.indexOf(value)
    this._value = value
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }
}
