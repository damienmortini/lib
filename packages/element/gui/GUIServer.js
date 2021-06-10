const guiServers = new Map();

export class GUIServer {
  static get(value) {
    let guiServer = guiServers.get(value);
    if (!guiServer) guiServer = new GUIServer({ name: value });
    return guiServer;
  }

  constructor({ name = undefined } = {}) {
    if (name) guiServers.set(name, this);
    this._guiElements = new Set();
  }

  register(guiElement) {
    this._guiElements.add(guiElement);
  }

  unregister(guiElement) {
    this._guiElements.delete(guiElement);
  }

  add(options) {
    for (const guiElement of this._guiElements) {
      guiElement.add(options);
    }
  }
}
