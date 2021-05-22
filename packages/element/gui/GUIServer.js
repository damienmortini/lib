export class GUIServer {
  constructor() {
    this._guiElements = new Map();
  }

  register(id, guiElement) {
    this._guiElements.set(id, guiElement);
  }

  unregister(id) {
    this._guiElements.delete(id);
  }

  addTo(name, options) {
    this._guiElements.get(name)?.add(options);
  }
}
