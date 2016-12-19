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
        empty.value = "x";
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
