export default class InputElement extends HTMLElement {
  static get observedAttributes() {
    return ["name", "value", "disabled"];
  }

  constructor() {
    super();

    this.type = undefined;

    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: center;
        }
        label {
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0 5px;
          width: 25%;
        }
        label:empty {
          display: none;
        }
        input {
          flex: 1;
          width: 100%;
        }
      </style>
      <label></label>
      <slot><input></slot>
    `;

    const dispatchEvent = (event) => {
      event.stopPropagation();
      this.dispatchEvent(new event.constructor(event.type, event));
    };
    this.shadowRoot.addEventListener("input", dispatchEvent);
    this.shadowRoot.addEventListener("change", dispatchEvent);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    switch (name) {
      case "disabled":
        this[name] = newValue !== null;
        break;
      default:
        this[name] = newValue;
        break;
    }
  }

  get name() {
    return this._name;
  }

  set name(value) {
    const label = this.shadowRoot.querySelector("label");
    this._name = label.textContent = label.title = value;
  }

  /**
   * @type {any}
   */
  get value() {
    return this.shadowRoot.querySelector("input").value;
  }

  set value(value) {
    this.shadowRoot.querySelector("input").value = value;
  }

  get defaultValue() {
    return this.shadowRoot.querySelector("input").defaultValue;
  }

  set defaultValue(value) {
    this.shadowRoot.querySelector("input").defaultValue = value;
  }

  get disabled() {
    return this.shadowRoot.querySelector("input").disabled;
  }

  set disabled(value) {
    this.shadowRoot.querySelector("input").disabled = value;
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      value: this.value,
    };
  }
}
