export default class InputTextElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
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
      <textarea rows="1"></textarea>
    `;

    this._textarea = this.shadowRoot.querySelector('textarea');

    for (const key in HTMLTextAreaElement.prototype) {
      if (key in InputTextElement.prototype) {
        continue;
      }
      Object.defineProperty(this, key, {
        get() {
          return this._textarea[key];
        },
        set(value) {
          this._textarea[key] = value;
        },
      });
    }

    if (this.getAttribute('value')) {
      this.value = this.getAttribute('value');
    }
  }

  get value() {
    return this._textarea.value;
  }

  set value(value) {
    if (this._textarea.value === value) {
      return;
    }
    this._textarea.value = value;
    this.dispatchEvent(new Event('input', {
      bubbles: true,
    }));
  }
}
