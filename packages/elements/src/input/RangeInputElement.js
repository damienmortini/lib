export default class RangeInputElement extends HTMLElement {
  static get observedAttributes() {
    return ["value", "disabled", "step", "min", "max"];
  }

  constructor() {
    super();

    this.attachShadow({ mode: "open" }).innerHTML = `
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

    this._rangeInput = this.shadowRoot.querySelector("input[type=range]");
    this._numberInput = this.shadowRoot.querySelector("input[type=number]");

    this._rangeInput.addEventListener("input", () => {
      this.value = this._rangeInput.valueAsNumber;
      this._numberInput.valueAsNumber = this.value;
    });

    this._numberInput.addEventListener("input", () => {
      this.value = this._numberInput.valueAsNumber;
      this._rangeInput.valueAsNumber = this.value;
    });

    for (const key in this._numberInput) {
      if (key in RangeInputElement.prototype) {
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
  }

  get value() {
    return this._numberInput.valueAsNumber;
  }

  set value(value) {
    this._rangeInput.valueAsNumber = value;
    this._numberInput.valueAsNumber = value;
  }
}
