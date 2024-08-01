export default class NumberInputElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled', 'min', 'max', 'step'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        input {
          width: 100%;
          box-sizing: border-box;
        }
      </style>
      <input type="number">
    `;

    this._input = this.shadowRoot.querySelector('input');

    this._input.addEventListener('change', event => this.dispatchEvent(new Event('change', event)));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        this.value = Number(newValue);
      case 'min':
      case 'max':
      case 'step':
        this._input[name] = Number(newValue);
        break;
      case 'disabled':
        this._input.disabled = this.disabled;
        break;
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    }
    else {
      this.removeAttribute('disabled');
    }
  }

  get max() {
    return Number(this.getAttribute('max'));
  }

  set max(value) {
    this.setAttribute('max', String(value));
  }

  get min() {
    return Number(this.getAttribute('min'));
  }

  set min(value) {
    this.setAttribute('min', String(value));
  }

  get step() {
    return Number(this.getAttribute('step'));
  }

  set step(value) {
    this.setAttribute('step', String(value));
  }

  get value() {
    return this._input.valueAsNumber;
  }

  set value(value) {
    if (value === this.value) {
      return;
    }
    this._input.valueAsNumber = value;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

customElements.define('damo-input-number', NumberInputElement);
