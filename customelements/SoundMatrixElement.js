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

    dlib-soundmatrix .pad {
      box-sizing: border-box;
      position: relative;
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 2px;
      vertical-align: middle;
      cursor: pointer;
      transition-duration: .1s;
      border: 1px solid;
      will-change: transform;
    }

    dlib-soundmatrix .pad.highlight::after {
      transform: scale(.4);
    }

    dlib-soundmatrix .pad.highlight:checked::before {
      transform: scale(1);
    }

    dlib-soundmatrix .pad::before, dlib-soundmatrix .pad::after {
      content: "";
      will-change: transform;
      position: absolute;
      display: block;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      transition-property: transform;
      transition-timing-function: ease-in-out;
      transition-duration: .1s;
    }

    dlib-soundmatrix .pad::after {
      background: black;
      border-radius: 2px;
      transform: scale(0);
    }

    dlib-soundmatrix .pad::before {
      transform: scale(0);
      border-radius: 1px;
      background: black;
    }

    dlib-soundmatrix .pad:checked::before {
      transform: scale(.8);
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
        pad.classList.toggle("highlight", i === beat);
      }
    }
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
