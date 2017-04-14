import "@webcomponents/custom-elements";

import LoopElement from "./LoopElement.js";
import SoundMatrix from "../audio/SoundMatrix.js";

(() => {
  let style = document.createElement("style");
  style.textContent = `
    dlib-soundmatrix *:focus {
      outline: none;
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

  set soundMatrix(value) {
    if(this._soundMatrix) {
      this._soundMatrix.onBeat.delete(this._onBeatBinded);
    }
    this._soundMatrix = value;
    this._soundMatrix.onBeat.add(this._onBeatBinded = this._onBeat.bind(this));
  }

  get soundMatrix() {
    return this._soundMatrix;
  }

  _onBeat(beat) {
    for (let pads of this._padsMatrix.values()) {
      for (let [i, pad] of pads.entries()) {
        if(i !== beat && pad.classList.contains("highlight")) {
          pad.classList.remove("highlight");
        } else if(i === beat && !pad.classList.contains("highlight")) {
          pad.classList.add("highlight");
        }
      }
    }
  }

  update() {
    super.update();

    for (let [sound, array] of this.soundMatrix) {
      let pads = this._padsMatrix.get(sound);

      if(!pads) {
        let row = document.createElement("div");
        row.classList.add("row");

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
          let pad = document.createElement("input");
          pad.onkeyup = (e) => {
            if(e.keyCode === 32) {
              e.preventDefault();
            }
          }
          pad.type = "checkbox";
          pad.classList.add("pad");
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
