export default class DamdomCheckbox extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 12px;
          height: 12px;
        }
        input {
          margin: 0;
          width: 100%;
          height: 100%;
        }
      </style>
      <input type="checkbox">
    `;

    this._input = this.shadowRoot.querySelector('input');
    this._input.addEventListener('input', event => this.dispatchEvent(new Event('change', event)));
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
    }
    else {
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
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

customElements.define('damdom-checkbox', DamdomCheckbox);
