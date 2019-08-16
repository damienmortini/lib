export default class InputFileElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        input {
          width: 100%;
        }
      </style>
      <input type="file">
    `;

    this._input = this.shadowRoot.querySelector("input");

    for (const key in HTMLInputElement.prototype) {
      if (key in InputFileElement.prototype) {
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

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (this._input.getAttribute(mutation.attributeName) === this.getAttribute(mutation.attributeName)) {
          return;
        }
        if (mutation.target === this._input) {
          this.setAttribute(mutation.attributeName, this._input.getAttribute(mutation.attributeName));
        } else {
          this._input.setAttribute(mutation.attributeName, this.getAttribute(mutation.attributeName));
        }
      }
    });
    observer.observe(this._input, { attributes: true });
    observer.observe(this, { attributes: true });
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
  }
}
