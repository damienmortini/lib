import InputElement from "./InputElement.js";

export default class NumberInputElement extends InputElement {
  static get observedAttributes() {
    return [...InputElement.observedAttributes, "step", "min", "max"];
  }

  constructor() {
    super();

    this.type = "number";

    this._input = this.shadowRoot.querySelector("input");
    this._input.type = "number";
    this._input.step = ".01";
  }

  get value() {
    return this._input.valueAsNumber;
  }

  set value(value) {
    this._input.valueAsNumber = value;
  }

  get defaultValue() {
    return parseFloat(this._input.defaultValue);
  }

  set defaultValue(value) {
    this._input.defaultValue = value.toString();
  }

  get step() {
    return parseFloat(this._input.step);
  }

  set step(value) {
    this._input.step = value.toString();
  }

  get min() {
    return parseFloat(this._input.min);
  }

  set min(value) {
    this._input.min = value.toString();
  }

  get max() {
    return parseFloat(this._input.max);
  }

  set max(value) {
    this._input.max = value.toString();
  }

  toJSON() {
    return Object.assign(super.toJSON(), {
      step: this.step,
      min: this.min,
      max: this.max,
    });
  }
}
