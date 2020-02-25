export default class InputNumberElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled', 'min', 'max', 'step'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-flex;
        }
        input {
          flex: 1;
          width: 100%;
        }
      </style>
      <input type="number">
    `;

    this._input = this.shadowRoot.querySelector('input');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
      case 'min':
      case 'max':
      case 'step':
        this[name] = Number(newValue);
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
    } else {
      this.removeAttribute('disabled');
    }
  }

  get max() {
    return Number(this._input.max);
  }

  set max(value) {
    this._input.max = String(value);
  }

  get min() {
    return Number(this._input.min);
  }

  set min(value) {
    this._input.min = String(value);
  }

  get step() {
    return Number(this._input.step);
  }

  set step(value) {
    this._input.step = String(value);
  }

  get value() {
    return this._input.valueAsNumber;
  }

  set value(value) {
    this._input.valueAsNumber = value;
  }
}
