import "@webcomponents/custom-elements";

let _lastPaginationElementId = 0;

(() => {
  let style = document.createElement("style");
  style.textContent = `
    dlib-pagination input {
      -webkit-appearance: none;
      position: relative;
      color: inherit;
      width: 10px;
      height: 10px;
      border: 2px solid;
      border-radius: 50%;
      outline: none;
      cursor: pointer;
    }

    dlib-pagination input::before {
      content: "";
      position: absolute;
      display: block;
      top: 50%;
      left: 50%;
      color: inherit;
      box-sizing: border-box;
      box-sizing: border-box;
      border: 5px solid;
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0);
      transition: transform .4s;
    }

    dlib-pagination input:checked::before {
      transform: translate(-50%, -50%) scale(1);
    }
  `;
  document.head.appendChild(style);
})();

export default class PaginationElement extends HTMLElement {
  constructor() {
    super();

    this._uid = _lastPaginationElementId++;

    this._options = [];
  }

  set options(value) {
    this._options = value;

    this.innerHTML = "";

    this._buttons = new Map();
    for (let [i, option] of this._options.entries()) {
      let button = document.createElement("input");
      button.type = "radio";
      button.name = `dlib-pagination-${this._uid}`;
      button.id = option;
      this.appendChild(button); 
      this._buttons.set(option, button);
    }

    this.option = this._options[0];
  }

  get options() {
    return this._options;
  }

  set option(value) {
    this._option = value;
    this._buttons.get(this._option).checked = true;
  }

  get option() {
    return this._option;
  }
}

window.customElements.define("dlib-pagination", PaginationElement);
