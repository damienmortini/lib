let downedKeys = new Set();

export default class Keyboard {
  static get downedKeys() {
    return downedKeys;
  }
}

window.addEventListener("keydown", (e) => {
  downedKeys.add(e.key);
});

window.addEventListener("keyup", (e) => {
  downedKeys.delete(e.key);
});
