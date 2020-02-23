export default class InputButtonElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-flex;
          min-width: 20px;
          height: 20px;
          cursor: pointer;
        }
        button {
          flex: 1;
          resize: vertical;
          width: 100%;
          height: 100%;
        }
      </style>
      <button><slot></slot></button>
    `;

    const input = this.shadowRoot.querySelector('button');

    for (const key in HTMLButtonElement.prototype) {
      if (key in InputButtonElement.prototype) {
        continue;
      }
      Object.defineProperty(this, key, {
        get() {
          return input[key];
        },
        set(value) {
          input[key] = value;
        },
      });
    }

    if (this.getAttribute('value')) {
      this.value = JSON.parse(this.getAttribute('value'));
    }
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this.dispatchEvent(new Event('input', {
      bubbles: true,
    }));
  }
}
