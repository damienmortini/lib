import Signal from "../utils/Signal.js";

let keysDown = new Set();

let onKeyDown = new Signal();
let onKeyUp = new Signal();

export default class Keyboard {
  static get LEFT() {
    return 37;
  }
  static get RIGHT() {
    return 39;
  }
  static get UP() {
    return 38;
  }
  static get DOWN() {
    return 40;
  }
  static get SPACE() {
    return 32;
  }
  static get SHIFT() {
    return 16;
  }
  static hasKeyDown(keyCode) {
    return keysDown.has(keyCode);
  }
  static addEventListener(type, listener) {
    if(type === "keydown") {
      onKeyDown.add(listener);
    } else if(type === "keyup") {
      onKeyUp.add(listener);
    }
  }
  static removeEventListener(type, listener) {
    if(type === "keydown") {
      onKeyDown.delete(listener);
    } else if(type === "keyup") {
      onKeyUp.delete(listener);
    }
  }
}

window.addEventListener("keydown", (e) => {
  if(!Keyboard.hasKeyDown(e.keyCode)) {
    onKeyDown.dispatch(e);
  }
  keysDown.add(e.keyCode);
});

window.addEventListener("keyup", (e) => {
  keysDown.delete(e.keyCode);
  onKeyUp.dispatch(e);
});
