import InputElement from "./InputElement.js";

export default class TextInputElement extends InputElement {
  constructor() {
    super();

    this.type = "text";

    this._input = document.createElement("textarea");
    this._input.rows = 1;
    this.shadowRoot.querySelector("input").replaceWith(this._input);

    this._input.insertAdjacentHTML("beforebegin", `
      <style>
        textarea {
          flex: 1;
        }
      </style>
    `);
  }

  get value() {
    return this._input.value;
  }

  set value(value) {
    this._input.value = value;
  }

  get defaultValue() {
    return this._input.defaultValue;
  }

  set defaultValue(value) {
    this._input.defaultValue = value;
  }

  get disabled() {
    return this._input.disabled;
  }

  set disabled(value) {
    this._input.disabled = value;
  }
}
