import ConnectorInputElement from '../connector-input/index.js';

let activeConnector = null;

/**
 * Handle connector elements linking
 */
class ConnectorInputLinkableElement extends ConnectorInputElement {
  constructor() {
    super();

    // this.shadowRoot.innerHTML = `
    //   <style>
    //     :host {
    //       display: inline-block;
    //       cursor: pointer;
    //     }
    //     :host(:hover) {
    //       background: red;
    //     }
    //     :host(:focus-within) {
    //       background: green;
    //     }
    //     :host([connected]) {
    //       background: orange;
    //     }
    //     input {
    //       cursor: pointer;
    //       display: inline-block;
    //       margin: 5px;
    //     }
    //   </style>
    //   <slot>
    //     <input type="radio">
    //   </slot>
    // `;

    this.addEventListener('pointerdown', this._onPointerDown);

    // this._outputLinkMap = new Map();

    this._onWindowPointerUpBinded = this._onWindowPointerUp.bind(this);
    this.addEventListener('connected', this._onConnected);
    this.addEventListener('disconnected', this._onDisconnected);
  }

  // _addLink() {
  //   let root = this;
  //   let element = this;
  //   while (element) {
  //     element = element.parentElement || element.getRootNode().host;
  //     if (element && element.tagName === 'GRAPH-EDITOR') {
  //       root = element;
  //       break;
  //     }
  //   }

  //   const link = document.createElement('graph-link');
  //   root.prepend(link);
  //   return link;
  // }

  // _onConnected(event) {
  //   const link = this._outputLinkMap.get(undefined) || this._addLink();
  //   link.addEventListener('click', () => {
  //     link.input.outputs.delete(link.output);
  //   });
  //   link.input = event.target;
  //   link.output = event.detail.output;

  //   this._outputLinkMap.set(event.detail.output, link);
  // }

  _onPointerDown() {
    if (activeConnector) {
      return;
    }
    activeConnector = this;

    this.dispatchEvent(new Event('linkstart', {
      composed: true,
      bubbles: true,
    }));

    window.addEventListener('pointerup', this._onWindowPointerUpBinded);
  }

  _onWindowPointerUp(event) {
    if (!activeConnector) {
      return;
    }

    let connector;
    for (const element of event.path) {
      if (element instanceof ConnectorInputLinkableElement) {
        connector = element;
        break;
      }
    }

    if (connector === activeConnector) {
      return;
    }

    window.removeEventListener('pointerup', this._onWindowPointerUpBinded);

    if (!connector || (activeConnector.type === connector.type && connector.type !== ConnectorInputLinkableElement.TYPE_BOTH)) {
      activeConnector = null;
      return;
    }

    const inputConnector = activeConnector.type & ConnectorInputLinkableElement.TYPE_OUTPUT ? activeConnector : connector;
    const outputConnector = connector.type & ConnectorInputLinkableElement.TYPE_INPUT ? connector : activeConnector;

    inputConnector.outputs.add(outputConnector);

    activeConnector = null;
  }
}

export default ConnectorInputLinkableElement;
