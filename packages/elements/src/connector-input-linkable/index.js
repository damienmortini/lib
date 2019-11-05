import ConnectorInputElement from '../connector-input/index.js';

let activeConnector = null;

/**
 * Handle connector elements linking
 */
class ConnectorInputLinkableElement extends ConnectorInputElement {
  constructor() {
    super();

    this.shadowRoot.querySelector('slot style').insertAdjacentHTML('beforeend', `
      :host(:hover) {
        background: red;
      }
      :host(:focus-within) {
        background: green;
      }
      :host([connected]) {
        background: orange;
      }
    `);

    this.addEventListener('pointerdown', this._onPointerDown);

    this._onWindowPointerUpBinded = this._onWindowPointerUp.bind(this);
  }

  _onPointerDown() {
    if (activeConnector) {
      return;
    }
    activeConnector = this;

    window.addEventListener('pointerup', this._onWindowPointerUpBinded);

    this.dispatchEvent(new CustomEvent('linkstart', {
      composed: true,
      bubbles: true,
      detail: {
        input: this,
        output: undefined,
      },
    }));
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
      this.dispatchEvent(new CustomEvent('linkend', {
        composed: true,
        bubbles: true,
        detail: {
          input: null,
          output: null,
        },
      }));
      return;
    }

    const inputConnector = activeConnector.type & ConnectorInputLinkableElement.TYPE_OUTPUT ? activeConnector : connector;
    const outputConnector = connector.type & ConnectorInputLinkableElement.TYPE_INPUT ? connector : activeConnector;

    inputConnector.outputs.add(outputConnector);

    activeConnector = null;

    this.dispatchEvent(new CustomEvent('linkend', {
      composed: true,
      bubbles: true,
      detail: {
        input: inputConnector,
        output: outputConnector,
      },
    }));
  }
}

export default ConnectorInputLinkableElement;
