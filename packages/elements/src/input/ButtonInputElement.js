import InputElement from "./InputElement.js";

export default class ButtonInputElement extends InputElement {
  constructor() {
    super();

    this.type = "button";

    this._input = document.createElement("button");
    this.shadowRoot.querySelector("input").replaceWith(this._input);

    this._input.insertAdjacentHTML("beforebegin", `
      <style>
        button {
          flex: 1;
        }
      </style>
    `);
  }

  get name() {
    return this._input.textContent;
  }

  set name(value) {
    this._input.textContent = value;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this.dispatchEvent(new Event("input", {
      bubbles: true,
    }));
    this.dispatchEvent(new Event("change", {
      bubbles: true,
    }));
  }

  get defaultValue() {
    return this._defaultValue;
  }

  set defaultValue(value) {
    this._defaultValue = value;
  }

  get disabled() {
    return this._input.disabled;
  }

  set disabled(value) {
    this._input.disabled = value;
  }
}
