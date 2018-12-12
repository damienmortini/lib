import InputElement from "./InputElement.js";

export default class SelectInputElement extends InputElement {
  static get observedAttributes() {
    return [...InputElement.observedAttributes, "options"];
  }

  constructor() {
    super();

    this.type = "select";

    this._input = document.createElement("select");
    this.shadowRoot.querySelector("input").replaceWith(this._input);

    this._input.insertAdjacentHTML("beforebegin", `
      <style>
        select {
          flex: 1;
        }
      </style>
    `);

    this._optionsMap = new Map();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    switch (name) {
      case "options":
        this.options = new Function(`return ${newValue}`).apply(this);
        break;
      default:
        super.attributeChangedCallback(name, oldValue, newValue);
        break;
    }
  }

  get value() {
    return this._optionsMap.get(this._input.value);
  }

  set value(value) {
    this._value = value;
    this._input.value = value;
  }

  get defaultValue() {
    return this._defaultValue;
  }

  set defaultValue(value) {
    this._defaultValue = value;
  }

  get options() {
    return this._options;
  }

  set options(value) {
    this._options = value;
    this._input.innerHTML = "";
    this._optionsMap = new Map();
    for (let option of this._options) {
      const optionElement = document.createElement("option");
      const stringifiedOption = typeof option === "object" ? JSON.stringify(option) : option.toString();
      optionElement.value = stringifiedOption;
      optionElement.text = stringifiedOption;
      optionElement.selected = option === this.value;
      this._input.add(optionElement);
      this._optionsMap.set(stringifiedOption, option);
    }
    this.value = this._value;
  }

  get disabled() {
    return this._input.disabled;
  }

  set disabled(value) {
    this._input.disabled = value;
  }
}
