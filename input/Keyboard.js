let keysDown = new Set();

export default class Keyboard {
  static isKeyDown(keyCode) {
    return keysDown.has(keyCode);
  }
}

window.addEventListener("keydown", (e) => {
  keysDown.add(e.keyCode);
});

window.addEventListener("keyup", (e) => {
  keysDown.delete(e.keyCode);
});
