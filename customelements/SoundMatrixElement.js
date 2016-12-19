import "@webcomponents/custom-elements";

import LoopElement from "./LoopElement.js";
import SoundMatrix from "../audio/SoundMatrix.js";

(function() {
  let style = document.createElement("style");
  style.textContent = `
    dlib-soundmatrix {
      position: absolute;
      left: 0;
      top: 0;
    }

    dlib-soundmatrix *:focus {
      outline: none;
    }

    dlib-soundmatrix input[type="button"] {
      background: transparent;
      border: none;
      cursor: pointer;
    }

    dlib-soundmatrix input[type="checkbox"] {
      -webkit-appearance: none;
      border: 1px solid black;
      width: 12px;
      height: 12px;
      vertical-align: middle;
      border-radius: 2px;
      cursor: pointer;
    }

    dlib-soundmatrix input[type="checkbox"]::before {
      content: "";
      display: block;
      width: 8px;
      height: 8px;
      margin: 1px;
      border-radius: 1px;
      background: black;
      transition: transform .2s;
      transition-timing-function: ease-in-out;
      transform: scale(0);
    }

    dlib-soundmatrix input[type="checkbox"]:checked::before {
      transform: scale(1);
    }
  `;
  document.head.appendChild(style);
})();

export default class SoundMatrixElement extends LoopElement {
  constructor({soundMatrix = new SoundMatrix()} = {}) {
    super();

    this.soundMatrix = soundMatrix;

    this._padsMatrix = new Map();
  }

  update() {
    super.update();

    for (let [sound, array] of this.soundMatrix) {
      let pads = this._padsMatrix.get(sound);

      if(!pads) {
        let row = document.createElement("div");
        row.classList.add(".row");

        let empty = document.createElement("input")
        empty.type = "button";
        empty.value = "✖";
        empty.onclick = () => {
          for (let i = 0; i < array.length; i++) {
            array[i] = 0;
          }
        }
        row.appendChild(empty);

        pads = [];
        for (let i = 0; i < this.soundMatrix.beats; i++) {
          let pad = document.createElement("input")
          pad.type = "checkbox";
          pad.onchange = () => {
            array[i] = pad.checked ? 1 : 0;
          }
          row.appendChild(pad);
          pads.push(pad);
        }
        this._padsMatrix.set(sound, pads)

        this.appendChild(row);
      }

      for (let [i, pad] of pads.entries()) {
        pad.checked = !!array[i];
      }
    }
  }
}

window.customElements.define("dlib-soundmatrix", SoundMatrixElement);
