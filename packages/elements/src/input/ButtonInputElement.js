export default class ButtonInputElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host {
          display: inline-flex;
        }
        button {
          flex: 1;
          resize: vertical;
          width: 100%;
          height: 20px;
        }
      </style>
      <button><slot></slot></button>
    `;

    const input = this.shadowRoot.querySelector("button");

    for (const key in input) {
      if (key in ButtonInputElement.prototype) {
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
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this.dispatchEvent(new Event("input", {
      bubbles: true,
    }));
    this.dispatchEvent(new Event("change", {
      bubbles: true,
    }));
  }
}
