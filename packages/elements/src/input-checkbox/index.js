export default class InputCheckboxElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
      </style>
      <input type="checkbox">
    `;

    this._input = this.shadowRoot.querySelector('input');

    for (const key in HTMLInputElement.prototype) {
      if (key in InputCheckboxElement.prototype) {
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

    this.value = this.getAttribute('value') === 'true';
  }

  get value() {
    return this._input.checked;
  }

  set value(value) {
    if (value === this._input.checked) {
      return;
    }
    this._input.checked = value;
    this.dispatchEvent(new Event('input', {
      bubbles: true,
    }));
  }
}
