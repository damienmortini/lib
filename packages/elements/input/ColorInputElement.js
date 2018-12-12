import InputElement from "./InputElement.js";
import Color from "../../dlib/math/Color.js";

export default class ColorInputElement extends InputElement {
  constructor() {
    super();

    this.type = "color";

    // this.shadowRoot.querySelector("slot").innerHTML = `
    //   <style>
    //     input {
    //       flex: .5;
    //       box-sizing: border-box;
    //     }
    //   </style>
    //   <input type="text">
    //   <input type="color">
    // `;

    this._input = this.shadowRoot.querySelector("input");

    this._colorInput = this._input.cloneNode();
    this._colorInput.type = "color";

    this._input.insertAdjacentElement("beforebegin", this._colorInput);

    this._colorInput.insertAdjacentHTML("beforebegin", `
      <style>
        input[type=color] {
          box-sizing: border-box;
          height: 20px;
        }
      </style>
    `);

    const onInput = (event) => {
      this.value = event.target.value;
    };
    this.shadowRoot.addEventListener("input", onInput);
  }

  get value() {
    return this._value;
  }

  set value(value) {
    const hexValue = this._valueToHexadecimal(value);

    if (typeof this._value === "object" && typeof value === "string") {
      const RGBA = Color.styleToRGBA(hexValue);
      if (this._value.r !== undefined) {
        [this._value.r, this._value.g, this._value.b] = [RGBA[0], RGBA[1], RGBA[2]];
      } else if (this._value.x !== undefined) {
        [this._value.x, this._value.y, this._value.z] = [RGBA[0], RGBA[1], RGBA[2]];
      } else {
        [this._value[0], this._value[1], this._value[2]] = [RGBA[0], RGBA[1], RGBA[2]];
      }
    } else if (typeof this._value === "object" && typeof value === "object") {
      if (this._value.r !== undefined) {
        [this._value.r, this._value.g, this._value.b] = [value.r, value.g, value.b];
      } else if (this._value.x !== undefined) {
        [this._value.x, this._value.y, this._value.z] = [value.x, value.y, value.z];
      } else {
        [this._value[0], this._value[1], this._value[2]] = [value[0], value[1], value[2]];
      }
    } else {
      this._value = value;
    }

    this._input.value = typeof value === "string" ? value : hexValue;
    this._colorInput.value = hexValue;
  }

  get disabled() {
    return this._input.disabled;
  }

  set disabled(value) {
    this._input.disabled = value;
    this._colorInput.disabled = value;
  }

  _valueToHexadecimal(value) {
    let RGBA;

    if (typeof value === "string") {
      RGBA = Color.styleToRGBA(value);
    } else if (value.r !== undefined) {
      RGBA = [value.r, value.g, value.b, 1];
    } else if (value.x !== undefined) {
      RGBA = [value.x, value.y, value.z, 1];
    } else {
      RGBA = [value[0], value[1], value[2], 1];
    }

    return `#${Math.floor(RGBA[0] * 255).toString(16).padStart(2, "0")}${Math.floor(RGBA[1] * 255).toString(16).padStart(2, "0")}${Math.floor(RGBA[2] * 255).toString(16).padStart(2, "0")}`;
  }

  toJSON() {
    return Object.assign(super.toJSON(), {
      value: this._valueToHexadecimal(this.value),
    });
  }
}
