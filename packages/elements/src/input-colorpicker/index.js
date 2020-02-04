import '../../../../a-color-picker/dist/acolorpicker.js';

export default class InputColorPickerElement extends HTMLElement {
  static get observedAttributes() {
    return ['value'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        @import url("/node_modules/a-color-picker/src/acolorpicker.css");
        
        :host {
          display: inline-block;
          position: relative;
          width: 20px;
          height: 20px;
          margin: 4px;
        }

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
          visibility: hidden;
          z-index: 1;
        }

        :host(:focus-within) #colorpicker {
          visibility: visible;
        }
      </style>
      <div id="container" tabindex="-1">
        <div id="color"></div>
        <div id="colorpicker"></div>
      </div>
    `;

    const container = this.shadowRoot.querySelector('#container');

    this._color = this.shadowRoot.querySelector('#color');
    this._colorPicker = AColorPicker.createPicker({
      attachTo: this.shadowRoot.querySelector('#colorpicker'),
      showAlpha: true,
      color: 'black',
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
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        this.value = newValue;
        break;
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
