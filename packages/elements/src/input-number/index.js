export default class InputNumberElement extends HTMLElement {
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

    for (const key in HTMLInputElement.prototype) {
      if (key in InputNumberElement.prototype) {
        continue;
      }
      Object.defineProperty(this, key, {
        get() {
          return this._input[key];
        },
        set(value) {
          this._input[key] = value;
        },
      });
    }
  }

  get value() {
    return this._input.valueAsNumber;
  }

  set value(value) {
    this._input.valueAsNumber = value;
  }
}
