import Color from '../core/math/Color.js';

export default class InputColorElement extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled'];
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
        input[type=color] {
          box-sizing: border-box;
          height: 20px;
        }
      </style>
      <input type="color">
      <input type="text">
    `;

    this._colorInput = this.shadowRoot.querySelector('input[type=color]');
    this._textInput = this.shadowRoot.querySelector('input[type=text]');

    this._colorInput.addEventListener('input', (event) => {
      event.stopPropagation();
      this.value = this._colorInput.value;
      this.dispatchEvent(new Event('input', {
        bubbles: true,
      }));
    });

    this._textInput.addEventListener('input', (event) => {
      event.stopPropagation();
      this.value = this._textInput.value;
      this.dispatchEvent(new Event('input', {
        bubbles: true,
      }));
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        try {
          this.value = new Function(`return ${newValue}`).apply(this);
        } catch (error) {
          this.value = newValue;
        }
        break;
      case 'disabled':
        this._colorInput.disabled = this.disabled;
        this._textInput.disabled = this.disabled;
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
    return this._value;
  }

  set value(value) {
    const hexValue = this._valueToHexadecimal(value);

    if (typeof this._value === 'object' && typeof value === 'string') {
      const RGBA = Color.styleToRGBA(hexValue);
      if (this._value.r !== undefined) {
        [this._value.r, this._value.g, this._value.b] = [RGBA[0], RGBA[1], RGBA[2]];
      } else if (this._value.x !== undefined) {
        [this._value.x, this._value.y, this._value.z] = [RGBA[0], RGBA[1], RGBA[2]];
      } else {
        [this._value[0], this._value[1], this._value[2]] = [RGBA[0], RGBA[1], RGBA[2]];
      }
    } else if (typeof this._value === 'object' && typeof value === 'object') {
      if (this._value.r !== undefined) {
        [this._value.r, this._value.g, this._value.b] = [value.r, value.g, value.b];
      } else if (this._value.x !== undefined) {
        [this._value.x, this._value.y, this._value.z] = [value.x, value.y, value.z];
      } else {
        [this._value[0], this._value[1], this._value[2]] = [value[0], value[1], value[2]];
      }
    } else {
      this._value = value;
    }

    this._textInput.value = typeof value === 'string' ? value : hexValue;
    this._colorInput.value = hexValue;

    this.dispatchEvent(new Event('change', {
      bubbles: true,
    }));
  }

  _valueToHexadecimal(value) {
    let RGBA;

    if (typeof value === 'string') {
      RGBA = Color.styleToRGBA(value);
    } else if (value.r !== undefined) {
      RGBA = [value.r, value.g, value.b, 1];
    } else if (value.x !== undefined) {
      RGBA = [value.x, value.y, value.z, 1];
    } else {
      RGBA = [value[0], value[1], value[2], 1];
    }

    return `#${Math.floor(RGBA[0] * 255).toString(16).padStart(2, '0')}${Math.floor(RGBA[1] * 255).toString(16).padStart(2, '0')}${Math.floor(RGBA[2] * 255).toString(16).padStart(2, '0')}`;
  }
}
