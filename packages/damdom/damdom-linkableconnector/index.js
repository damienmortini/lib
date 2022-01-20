import DamdomConnector from '../damdom-connector/index.js'

const CONNECTORS = new Set()

let activeConnector = null

/**
 * Handle connector elements linking
 */
class DamdomLinkableConnector extends DamdomConnector {
  constructor() {
    super()

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
    `)

    this.addEventListener('pointerdown', this._onPointerDown)

    this._onWindowPointerUpBound = this._onWindowPointerUp.bind(this)
  }

  connectedCallback() {
    super.connectedCallback()
    CONNECTORS.add(this)
    this.addEventListener('connected', this._onConnected)
  }

  disconnectedCallback() {
    this.removeEventListener('connected', this._onConnected)
    window.removeEventListener('pointerup', this._onWindowPointerUpBound)
    CONNECTORS.delete(this)
    super.disconnectedCallback()
  }

  _onConnected(event) {
    this.dispatchEvent(new CustomEvent('connectorlink', {
      composed: true,
      bubbles: true,
      detail: {
        input: this,
        output: event.detail.output,
      },
    }))
  }

  _onPointerDown(event) {
    if (activeConnector) {
      return
    }
    event.stopPropagation()
    activeConnector = this

    window.addEventListener('pointerup', this._onWindowPointerUpBound, { passive: false })

    this.dispatchEvent(new CustomEvent('connectorlink', {
      composed: true,
      bubbles: true,
      detail: {
        input: this,
        output: undefined,
      },
    }))
  }

  _onWindowPointerUp(event) {
    if (!activeConnector) {
      return
    }

    let hitConnector

    for (const connector of CONNECTORS) {
      const boundingClientRect = connector.getBoundingClientRect()
      if (event.clientX > boundingClientRect.x &&
        event.clientX < boundingClientRect.x + boundingClientRect.width &&
        event.clientY > boundingClientRect.y &&
        event.clientY < boundingClientRect.y + boundingClientRect.height) {
        hitConnector = connector
      }
    }

    if (hitConnector === activeConnector) {
      return
    }

    window.removeEventListener('pointerup', this._onWindowPointerUpBound)

    if (!hitConnector || (activeConnector.type === hitConnector.type && hitConnector.type !== DamdomLinkableConnector.TYPE_BOTH)) {
      activeConnector = null
      this.dispatchEvent(new CustomEvent('connectorlink', {
        composed: true,
        bubbles: true,
        detail: {
          input: null,
          output: null,
        },
      }))
      return
    }

    const inputConnector = activeConnector.type & DamdomLinkableConnector.TYPE_INPUT || hitConnector.type & DamdomLinkableConnector.TYPE_OUTPUT ? hitConnector : activeConnector
    const outputConnector = inputConnector === activeConnector ? hitConnector : activeConnector

    inputConnector.outputs.add(outputConnector)

    activeConnector = null
  }
}

export default DamdomLinkableConnector

window.customElements.define('damdom-linkableconnector', DamdomLinkableConnector)
