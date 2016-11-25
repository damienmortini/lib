export default class GUIInput extends HTMLElement {
  constructor () {
    super();

    this.object = null;
    this.key = "";

    this._inputs = null;

    this._type = "";
    this._label = "";

    this._onChangeBinded = this._onChange.bind(this);
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

  update() {
    for (let input of this._inputs) {
      input.value = this.object[this.key];
    }
  }

  _onChange(e) {
    let value;

    if(e.target.type === "checkbox") {
      value = e.target.checked;
    } else if(e.target.type === "button") {
      this.object[this.key]();
    } else {
      value = e.target.value;
    }
    this.object[this.key] = value;

    this.update();
  }

  _updateHTML() {
    if(!this.object || !this.key || !this.label) {
      console.error("While waiting for ShadowDOM to be cross-browsers, object, key and label need to be defined before type.");
    }

    this.removeEventListener("input", this._onChangeBinded);
    this.removeEventListener("change", this._onChangeBinded);
    this.removeEventListener("click", this._onChangeBinded);

    this.innerHTML = `
      <style>
        dlib-guiinput {
          display: flex;
          position: relative;
          color: white;
          font-family: monospace;
          font-size: 12px;
          text-transform: uppercase;
        }

        dlib-guiinput label, dlib-guiinput input {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          margin: 0 5px;
        }

        dlib-guiinput label {
          flex: 1;
          text-overflow: ellipsis;
          overflow: hidden;
          min-width: 20%;
        }

        dlib-guiinput input {
          flex: 5;
        }

        dlib-guiinput input:nth-of-type(2) {
          flex: 1.25;
        }

        dlib-guiinput input[type=range] {
          -webkit-appearance: none;
          background: transparent;
        }

        dlib-guiinput input[type=range]:focus {
          outline: none;
        }

        dlib-guiinput input[type=range]::-webkit-slider-runnable-track {
          -webkit-appearance: none;
          height: 4px;
          background: black;
        }

        dlib-guiinput input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          background: blue;
          width: 12px;
          height: 12px;
          margin-top: -4px;
          cursor: ew-resize;
        }

        dlib-guiinput input[type=checkbox] {
          margin-left: 2px;
        }
      </style>

      <label title="${this.label}">${this.label}</label>
      ${this.type === "select" ? "<select></select>" : `<input type="${this.type}"/>`}

      ${this.type === "range" ? "<input type=\"text\"/>" : ""}
    `;

    this._inputs = [...this.querySelectorAll("input")];

    if(this.type === "range") {
      let nextDecimal = Math.pow(10, Math.abs(parseInt(this.object[this.key])).toString().length);
      this.max = !this.object[this.key] ? 1 : nextDecimal;
      this.min = this.object[this.key] >= 0 ? 0 : -nextDecimal;
      this.step = .01;
    } else if(this.type === "select") {
      for (let option of options) {
        let optionElement = document.createElement("option");
        // TODO: finish this
        // optionElement
        this._inputs[0].appendChild(optionElement);
      }
    }

    if(this.type === "button") {
      this.addEventListener("click", this._onChangeBinded);
      this._inputs[0].value = this.label;
    } else {
      this.addEventListener("input", this._onChangeBinded);
      this.addEventListener("change", this._onChangeBinded);
    }

    this.update();
  }
}

window.customElements.define("dlib-guiinput", GUIInput);
