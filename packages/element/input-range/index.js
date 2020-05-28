export default class InputRangeElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'max', 'min', 'step', 'disabled'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
        }
        input {
          flex: 1;
          width: 100%;
          min-width: 0;
        }
        input[type=range] {
          flex: 2;
        }
      </style>
      <input max="1" step="0.01" type="range">
      <input max="1" step="0.01" type="number">
    `;

    this._rangeInput = this.shadowRoot.querySelector('input[type=range]');
    this._numberInput = this.shadowRoot.querySelector('input[type=number]');
    this._value = this._numberInput.valueAsNumber = this._rangeInput.valueAsNumber;

    this._rangeInput.addEventListener('input', (event) => {
      event.stopPropagation();
      this.value = this._rangeInput.valueAsNumber;
      this._numberInput.valueAsNumber = this.value;
      this.dispatchEvent(new Event('input', {
        bubbles: true,
      }));
    });

    this._numberInput.addEventListener('input', (event) => {
      event.stopPropagation();
      this.value = this._numberInput.valueAsNumber;
      this._rangeInput.valueAsNumber = this.value;
      this.dispatchEvent(new Event('input', {
        bubbles: true,
      }));
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        this.value = Number(newValue);
        break;
      case 'max':
      case 'min':
      case 'step':
        this._rangeInput[name] = Number(newValue);
        this._numberInput[name] = Number(newValue);
        break;
      case 'disabled':
        this._rangeInput.disabled = this.disabled;
        this._numberInput.disabled = this.disabled;
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
    return Number(this.getAttribute('max'));
  }

  set max(value) {
    this.setAttribute('max', String(value));
  }

  get min() {
    return Number(this.getAttribute('min'));
  }

  set min(value) {
    this.setAttribute('min', String(value));
  }

  get step() {
    return Number(this.getAttribute('step'));
  }

  set step(value) {
    this.setAttribute('step', String(value));
  }

  get value() {
    return this._value;
  }

  set value(value) {
    if (value === this._value) {
      return;
    }
    this._value = value;
    this._rangeInput.valueAsNumber = value;
    this._numberInput.valueAsNumber = value;
    this.dispatchEvent(new Event('change', {
      bubbles: true,
    }));
  }
}

customElements.define('damo-input-range', InputRangeElement);
