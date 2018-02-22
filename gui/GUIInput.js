let style = document.createElement("style");
document.head.appendChild(style);
style.sheet.insertRule(`
  dlib-guiinput {
    display: flex;
    position: relative;
    font-family: monospace;
    font-size: 12px;
    align-items: center;
    height: 20px;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput * {
    outline: none;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput label, dlib-guiinput input, dlib-guiinput select, dlib-gui textarea {
    display: flex;
    font-family: inherit;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin: 0 5px;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput label {
    flex: 1;
    min-width: 25%;
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
  dlib-guiinput button.clear {
    cursor: pointer;
    font-family: inherit;
    -webkit-appearance: none;
    border: none;
    font-size: 1em;
    padding: 0 5px;
    box-sizing: border-box;
    background: transparent;
    color: inherit;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput input, dlib-guiinput select, dlib-gui textarea {
    flex: 5;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput input.range {
    flex: 2;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput input[type="range"] {
    flex: 3.5;
  }
`, 0);
style.sheet.insertRule(`
  dlib-guiinput input.color {
    flex: 3.5;
  }
`, 0);

const roundToStep = (number, step) => {
  return (Math.round(number * (1 / step)) / (1 / step));
}

export default class GUIInput extends HTMLElement {
  constructor () {
    super();

    this._object = null;
    this._key = "";
    this._type = "";
    this._label = "";

    this._inputs = [];
    this._options = [];
    this._step = 0.01;
    this._min = 0;
    this._max = Infinity;

    this._initialValue = undefined;

    this._onChangeBinded = this._onChange.bind(this);
    this._onClearBinded = this._onClear.bind(this);
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
    this._step = value;
    for (let input of this._inputs) {
      input.step = this._step;
    }
    this.min = this.min;
    this.max = this.max;
  }

  get step() {
    return this._step;
  }

  set min(value) {
    this._min = roundToStep(value, this.step);
    for (let input of this._inputs) {
      input.min = this._min;
    }
  }

  get min() {
    return this._min;
  }

  set max(value) {
    this._max = roundToStep(value, this.step);
    for (let input of this._inputs) {
      input.max = this._max;
    }
  }

  get max() {
    return this._max;
  }

  set options(value) {
    this._options = value;
    if(!this._inputs[0] || this._inputs[0].tagName !== "SELECT") {
      return;
    }
    
    let html = "";
    for (let option of this._options) {
      html += `<option selected="${option === this.value}" value="${option}">${option}</option>`;
    }
    this._inputs[0].innerHTML = html;
  }

  get options() {
    return this._options;
  }

  update() {
    if(this.type === "button") {
      return;
    }
    
    let changed = false;
    for (let input of this._inputs) {
      let key;
      let value = this.value;
      switch (input.type) {
        case "checkbox":
          key = "checked";
          break;
        case "number":
          key = "valueAsNumber";
          break;
        case "select-one":
          key = "value";
          value = value.toString();
          break;
        default:
          key = "value";
          break;
      }

      if(value !== input[key]) {
        input[key] = value;
        changed = true;
      }
    }

    if(changed) {
      this.dispatchEvent(new Event("change"));
    }
  }

  _onChange(e) {
    let value;

    if(e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      this.value = e.target.checked;
    } else if(e.target.type === "range" || e.target.type === "number") {
      if(e.target.valueAsNumber === undefined) {
        return;
      }
      this.value = e.target.valueAsNumber;
    } else if(e.target.type === "button") {
      this.value();
    } else if(e.target.type === "color") {
      if(e.type === "change") {
        this.value = e.target.value;
      }
    } else {
      this.value = e.target.value;
    }
  }

  _onClear() {
    this.value = this._initialValue;
  }

  _updateHTML() {
    if(!this.object || !this.key || !this.type) {
      return;
    }

    if(this._initialValue === undefined) {
      this._initialValue = this.value;
    }

    this.removeEventListener("input", this._onChangeBinded);
    this.removeEventListener("change", this._onChangeBinded);
    this.removeEventListener("click", this._onChangeBinded);
    if(this.querySelector(".clear")) {
      this.querySelector(".clear").removeEventListener("click", this._onClearBinded);
    }

    // TODO: Update with ShadowDOM when cross-browser

    this.innerHTML = `
      <label title="${this.label}"><span>${this.label}</span></label>
      ${this.type === "select" ? "<select></select>" : (this.type === "text" ? `<textarea rows="1"></textarea>` : `<input type="${this.type}"/>`)}
      ${this.type === "range" ? "<input class=\"range\" type=\"number\"/>" : ""}
      ${this.type === "color" ? "<input class=\"color\" type=\"text\"/>" : ""}
      <button class="clear">✕</button>
    `;

    this._inputs = Array.from(this.querySelectorAll("input, select, textarea"));

    if(this.type === "range") {
      let nextDecimal = Math.pow(10, Math.abs(parseInt(this.value)).toString().length);
      this.max = this.max !== Infinity ? this.max : (this.value < 0 ? 0 : (Math.abs(this.value) < 1 ? 1 : nextDecimal));
      this.min = this.min || (this.value >= 0 ? 0 : (Math.abs(this.value) < 1 ? -1 : -nextDecimal));
    } else if(this.type === "button") {
      this._inputs[0].value = this.label;
    } else if(this.type === "select") {
      this.options = this.options;
    }

    this.step = this.step;

    this.querySelector(".clear").addEventListener("click", this._onClearBinded);
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
