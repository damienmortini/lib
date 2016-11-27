import "@webcomponents/custom-elements";

let style = document.createElement("style");
document.head.appendChild(style);
style.sheet.insertRule(`
  dlib-guiinput {
    display: flex;
    position: relative;
    color: white;
    font-family: monospace;
    font-size: 12px;
    text-transform: uppercase;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput label, dlib-guiinput input, dlib-guiinput select {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin: 0 5px;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput label {
    flex: 1;
    min-width: 20%;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput label span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput input, dlib-guiinput select {
    flex: 5;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput input:focus, dlib-guiinput select:focus {
    outline: none;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput input.range {
    flex: 2;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput input.color {
    flex: 3.5;
  }
`, 0);


export default class GUIInput extends HTMLElement {
  constructor () {
    super();

    this._object = null;
    this._key = "";
    this._type = "";
    this._label = "";

    this._inputs = [];
    this._options = [];

    this._onChangeBinded = this._onChange.bind(this);
  }

  set value(value) {
    this.object[this.key] = value;
    this.update();
  }

  get value() {
    return this.object[this.key];
  }

  set object(value) {
    this._object = value;
    this._updateHTML();
  }

  get object() {
    return this._object;
  }

  set key(value) {
    this._key = value;
    this._updateHTML();
  }

  get key() {
    return this._key;
  }

  set type(value) {
    this._type = value;
    this._updateHTML();
  }

  get type() {
    return this._type;
  }

  set label(value) {
    this._label = value;
    this._updateHTML();
  }

  get label() {
    return this._label;
  }

  set step(value) {
    for (let input of this._inputs) {
      input.step = value;
    }
  }

  get step() {
    this._inputs[0].step;
  }

  set min(value) {
    for (let input of this._inputs) {
      input.min = value;
    }
  }

  get min() {
    this._inputs[0].min;
  }

  set max(value) {
    for (let input of this._inputs) {
      input.max = value;
    }
  }

  get max() {
    this._inputs[0].max;
  }

  set options(value) {
    this._options = value;
    if(!this._inputs[0] || this._inputs[0].tagName !== "SELECT") {
      return;
    }
    this._inputs[0].options.length = 0;
    for (let option of this._options) {
      let optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.innerText = option;
      optionElement.selected = option === this.value;
      this._inputs[0].appendChild(optionElement);
    }
  }

  get options() {
    return this._options;
  }

  update() {
    if(this.type === "button") {
      return;
    }
    for (let input of this._inputs) {
      input[input.type === "checkbox" ? "checked" : "value"] = this.value;
    }
  }

  _onChange(e) {
    let value;

    if(this.type === "checkbox") {
      this.value = e.target.checked;
    } else if(this.type === "button") {
      this.value();
    } else if(this.type === "color") {
      if(e.type === "change") {
        this.value = e.target.value;
      }
    } else {
      this.value = e.target.value;
    }
  }

  _updateHTML() {
    if(!this.object || !this.key || !this.label || !this.type) {
      return;
    }

    // TODO: Update with ShadowDOM when cross-browser

    this.innerHTML = `
      <label title="${this.label}"><span>${this.label}</span></label>
      ${this.type === "select" ? "<select></select>" : `<input type="${this.type}"/>`}
      ${this.type === "range" ? "<input class=\"range\" type=\"number\"/>" : ""}
      ${this.type === "color" ? "<input class=\"color\" type=\"text\"/>" : ""}
    `;

    this._inputs = [...this.querySelectorAll("input, select")];

    if(this.type === "range") {
      let nextDecimal = Math.pow(10, Math.abs(parseInt(this.value)).toString().length);
      this.max = this.max || !this.value ? 1 : nextDecimal;
      this.min = this.min || this.value >= 0 ? 0 : -nextDecimal;
      this.step = this.step || .01;
    } else if(this.type === "button") {
      this._inputs[0].value = this.label;
    } else if(this.type === "select") {
      this.options = this.options;
    }

    this.removeEventListener("input", this._onChangeBinded);
    this.removeEventListener("change", this._onChangeBinded);
    this.removeEventListener("click", this._onChangeBinded);
    if(this.type === "button") {
      this.addEventListener("click", this._onChangeBinded);
    } else {
      this.addEventListener("input", this._onChangeBinded);
      this.addEventListener("change", this._onChangeBinded);
    }

    this.update();
  }
}

window.customElements.define("dlib-guiinput", GUIInput);
