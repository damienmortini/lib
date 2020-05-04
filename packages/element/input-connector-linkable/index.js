import InputConnectorElement from '../input-connector/index.js';

const CONNECTORS = new Set();

let activeConnector = null;

/**
 * Handle connector elements linking
 */
class InputConnectorLinkableElement extends InputConnectorElement {
  constructor() {
    super();

    this.shadowRoot.querySelector('slot style').insertAdjacentHTML('beforeend', `
      :host {
        cursor: pointer;
        touch-action: none;
      }
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

  connectedCallback() {
    super.connectedCallback();
    CONNECTORS.add(this);
    this.addEventListener('connected', this._onConnected);
  }

  disconnectedCallback() {
    this.removeEventListener('connected', this._onConnected);
    window.removeEventListener('pointerup', this._onWindowPointerUpBinded);
    CONNECTORS.delete(this);
    super.disconnectedCallback();
  }

  _onConnected(event) {
    this.dispatchEvent(new CustomEvent('connectorlink', {
      composed: true,
      bubbles: true,
      detail: {
        input: this,
        output: event.detail.output,
      },
    }));
  }

  _onPointerDown() {
    if (activeConnector) {
      return;
    }
    activeConnector = this;

    window.addEventListener('pointerup', this._onWindowPointerUpBinded, { passive: false });

    this.dispatchEvent(new CustomEvent('connectorlink', {
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

    let hitConnector;

    for (const connector of CONNECTORS) {
      const boundingClientRect = connector.getBoundingClientRect();
      if (event.clientX > boundingClientRect.x &&
        event.clientX < boundingClientRect.x + boundingClientRect.width &&
        event.clientY > boundingClientRect.y &&
        event.clientY < boundingClientRect.y + boundingClientRect.height) {
        hitConnector = connector;
      }
    }

    if (hitConnector === activeConnector) {
      return;
    }

    window.removeEventListener('pointerup', this._onWindowPointerUpBinded);

    if (!hitConnector || (activeConnector.type === hitConnector.type && hitConnector.type !== InputConnectorLinkableElement.TYPE_BOTH)) {
      activeConnector = null;
      this.dispatchEvent(new CustomEvent('connectorlink', {
        composed: true,
        bubbles: true,
        detail: {
          input: null,
          output: null,
        },
      }));
      return;
    }

    const inputConnector = activeConnector.type & InputConnectorLinkableElement.TYPE_INPUT || hitConnector.type & InputConnectorLinkableElement.TYPE_OUTPUT ? hitConnector : activeConnector;
    const outputConnector = inputConnector === activeConnector ? hitConnector : activeConnector;

    inputConnector.outputs.add(outputConnector);

    activeConnector = null;
  }
}

export default InputConnectorLinkableElement;
