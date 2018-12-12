import NumberInputElement from "./NumberInputElement.js";

export default class RangeInputElement extends NumberInputElement {
  constructor() {
    super();

    this.type = "range";

    this._input.max = "1";

    this._rangeInput = this._input.cloneNode();
    this._rangeInput.type = "range";

    this._input.insertAdjacentElement("beforebegin", this._rangeInput);

    this._rangeInput.insertAdjacentHTML("beforebegin", `
      <style>
        input[type=range] {
          flex: 2;
        }
      </style>
    `);

    const onInput = (event) => {
      this.value = event.target.valueAsNumber;
    };
    this.shadowRoot.addEventListener("input", onInput);
  }

  get value() {
    return super.value;
  }

  set value(value) {
    if (this.shadowRoot.activeElement !== this._input) {
      super.value = value;
    }
    this._rangeInput.valueAsNumber = value;
  }

  get step() {
    return super.step;
  }

  set step(value) {
    super.step = value;
    this._rangeInput.step = value;
  }

  get min() {
    return super.min;
  }

  set min(value) {
    super.min = value;
    this._rangeInput.min = value;
  }

  get max() {
    return super.max;
  }

  set max(value) {
    super.max = value;
    this._rangeInput.max = value;
  }

  set disabled(value) {
    super.disabled = value;
    this._rangeInput.disabled = value;
  }

  get disabled() {
    return super.disabled;
  }
}
