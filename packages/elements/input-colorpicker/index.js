import '../../a-color-picker/dist/acolorpicker.js';

const COLOR_PICKER_CSS = document.head.querySelector('style[data-source=a-color-picker]').innerHTML;

export default class InputColorPickerElement extends HTMLElement {
  static get observedAttributes() {
    return ['value'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
          width: 20px;
          height: 20px;
          margin: 4px;
        }

        :host([disabled]) {
          pointer-events: none;
        }

        ${COLOR_PICKER_CSS}

        #container, #color {
          width: 100%;
          height: 100%;
        }

        #color {
          border-radius: 4px;
          cursor: pointer;
          background: linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }

        #color::after {
          content: "";
          border-radius: inherit;
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          background-color: currentColor;
        }

        #colorpicker {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: none;
          z-index: 1;
        }

        :host(:focus-within) #colorpicker {
          display: block;
        }
      </style>
      <div id="container" tabindex="-1">
        <div id="color"></div>
        <div id="colorpicker"></div>
      </div>
    `;

    const container = this.shadowRoot.querySelector('#container');
    const colorPicker = this.shadowRoot.querySelector('#colorpicker');

    this._color = this.shadowRoot.querySelector('#color');
    this._colorPicker = AColorPicker.createPicker({
      attachTo: colorPicker,
      showAlpha: true,
      color: 'black',
    });

    container.addEventListener('input', (event) => {
      event.stopPropagation();
    });

    this._colorPicker.on('change', (target, color) => {
      this.value = target.color;
      this.dispatchEvent(new Event('input'));
    });

    this.addEventListener('keyup', (event) => {
      if (event.key.toLowerCase() === 'escape') {
        container.blur();
      }
    });

    container.addEventListener('focus', (event) => {
      const boundingClientRect = colorPicker.getBoundingClientRect();
      colorPicker.style.left = `${Math.max(-boundingClientRect.x + 20, 0)}px`;
      colorPicker.style.top = `${Math.max(-boundingClientRect.y + 20, 0)}px`;
    });

    container.addEventListener('blur', (event) => {
      colorPicker.style.top = '';
      colorPicker.style.left = '';
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        this.value = newValue;
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
    this._value = value;
    this._color.style.color = this._value;
    this._colorPicker.setColor(this._value, true);
  }
}
