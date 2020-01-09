export default class InputRangeElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'max', 'min', 'step'];
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

    this._rangeInput.addEventListener('input', (event) => {
      event.stopPropagation();
      this.value = this._rangeInput.valueAsNumber;
      this._numberInput.valueAsNumber = this.value;
    });

    this._numberInput.addEventListener('input', (event) => {
      event.stopPropagation();
      this.value = this._numberInput.valueAsNumber;
      this._rangeInput.valueAsNumber = this.value;
    });

    for (const key in HTMLInputElement.prototype) {
      if (key in InputRangeElement.prototype) {
        continue;
      }
      Object.defineProperty(this, key, {
        get() {
          return this._numberInput[key];
        },
        set(value) {
          this._rangeInput[key] = value;
          this._numberInput[key] = value;
        },
      });
    }

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (this._rangeInput.getAttribute(mutation.attributeName) === this.getAttribute(mutation.attributeName)) {
          return;
        }
        if (mutation.target === this._rangeInput) {
          this.setAttribute(mutation.attributeName, this._rangeInput.getAttribute(mutation.attributeName));
        } else {
          this._rangeInput.setAttribute(mutation.attributeName, this.getAttribute(mutation.attributeName));
        }
      }
    });
    observer.observe(this._rangeInput, { attributes: true });
    observer.observe(this, { attributes: true });

    if (this.getAttribute('value')) {
      this.value = Number(this.getAttribute('value'));
    }

    if (this.getAttribute('value')) {
      this.value = Number(this.getAttribute('value'));
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this[name] = Number(newValue);
  }

  get value() {
    return this._numberInput.valueAsNumber;
  }

  set value(value) {
    if (value === this._rangeInput.valueAsNumber && value === this._numberInput.valueAsNumber) {
      return;
    }
    this._rangeInput.valueAsNumber = value;
    this._numberInput.valueAsNumber = value;
    this.dispatchEvent(new Event('input', {
      bubbles: true,
    }));
  }
}
