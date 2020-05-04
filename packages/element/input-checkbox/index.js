export default class InputCheckboxElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled'];
  }

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
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        this.value = newValue === 'true';
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

  get value() {
    return this._input.checked;
  }

  set value(value) {
    if (value === this.value) {
      return;
    }
    this._input.checked = value;
    this.dispatchEvent(new Event('input', {
      bubbles: true,
    }));
  }
}
