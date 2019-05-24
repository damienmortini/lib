export default class TextInputElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" }).innerHTML = `
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
      <textarea rows="1">
    `;

    const input = this.shadowRoot.querySelector("textarea");

    for (const key in input) {
      if (key in TextInputElement.prototype) {
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
}
