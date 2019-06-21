import InputConnectorElement from "../input-connector/index.js";

let activeConnector = null;

/**
 * Handle connector elements linking
 */
class InputConnectorLinkElement extends InputConnectorElement {
  constructor() {
    super();

    this.addEventListener("pointerdown", this._onPointerDown);

    this._outputLinkMap = new Map();

    this._onWindowPointerUpBinded = this._onWindowPointerUp.bind(this);
    this.addEventListener("connected", this._onConnected);
    this.addEventListener("disconnected", this._onDisconnected);
  }

  _addLink() {
    let root = this;
    let element = this;
    while (element) {
      element = element.parentElement || element.getRootNode().host;
      if (element && element.tagName === "graph-EDITOR") {
        root = element;
        break;
      }
    }

    const link = document.createElement("graph-link");
    root.prepend(link);
    return link;
  }

  _onConnected(event) {
    const link = this._outputLinkMap.get(undefined) || this._addLink();
    link.addEventListener("click", () => {
      link.input.outputs.delete(link.output);
    });
    link.input = event.target;
    link.output = event.detail.output;

    this._outputLinkMap.set(event.detail.output, link);
  }

  _onDisconnected(event) {
    this._outputLinkMap.get(event.detail.output).remove();
    this._outputLinkMap.delete(event.detail.output);
  }

  _onPointerDown(event) {
    if (activeConnector) {
      return;
    }
    activeConnector = this;

    const link = this._addLink();
    link.input = this;

    this._outputLinkMap.set(undefined, link);

    window.addEventListener("pointerup", this._onWindowPointerUpBinded);
  }

  _onWindowPointerUp(event) {
    if (!activeConnector) {
      return;
    }

    let connector;
    for (const element of event.path) {
      if (element instanceof InputConnectorLinkElement) {
        connector = element;
        break;
      }
    }

    if (connector === activeConnector) {
      return;
    }

    this._outputLinkMap.get(undefined).remove();
    this._outputLinkMap.delete(undefined);

    window.removeEventListener("pointerup", this._onWindowPointerUpBinded);

    if (!connector || (activeConnector.type === connector.type && connector.type !== InputConnectorLinkElement.TYPE_BOTH)) {
      activeConnector = null;
      return;
    }

    const inputConnector = activeConnector.type & InputConnectorLinkElement.TYPE_OUTPUT ? activeConnector : connector;
    const outputConnector = connector.type & InputConnectorLinkElement.TYPE_INPUT ? connector : activeConnector;

    inputConnector.outputs.add(outputConnector);

    activeConnector = null;
  }
}

export default InputConnectorLinkElement;
