import InputElement from "./InputElement.js";

export default class CheckboxInputElement extends InputElement {
  constructor() {
    super();

    this.type = "checkbox";

    this._input = this.shadowRoot.querySelector("input");
    this._input.type = "checkbox";
  }

  get defaultValue() {
    return this._input.defaultChecked;
  }

  set defaultValue(value) {
    this._input.defaultChecked = value;
  }

  get value() {
    return this._input.checked;
  }

  set value(value) {
    this._input.checked = value;
  }
}
