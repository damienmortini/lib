import '../../../../@simonwep/pickr/dist/pickr.min.js';

document.head.insertAdjacentHTML('beforeend', `
  <style>
    @import url("node_modules/@simonwep/pickr/dist/pickr.min.css");
    .pcr-app {
      width: auto;
    }
    .pcr-type {
      display: none;
    }
  </style>
`);

export default class InputColorPickerElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        @import url("node_modules/@simonwep/pickr/dist/pickr.min.css");
        
        :host {
          display: block;
          position: relative;
        }

        .pickr {
          display: flex;
          justify-content: center;
        }
      </style>
      <div></div>
    `;

    this._pickr = window.Pickr.create({
      el: this.shadowRoot.querySelector('div'),
      comparison: false,
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
          hex: true,
          input: true,
          save: true,
        },
      },
    });

    this._pickr.on('init', () => {
      if (this.value) {
        this._pickr.setColor(this.value);
      }

      this._pickr.on('change', () => {
        this._value = this._pickr.getColor().toHEXA().toString();
        this.dispatchEvent(new Event('input'));
      });

      this._pickr.on('save', () => {
        this.dispatchEvent(new Event('input'));
      });
    });
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this._pickr.setColor(this._value);
  }
}
