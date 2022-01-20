import Signal from '@damienmortini/core/util/Signal.js'

const CONNECTOR_ADD_SIGNAL = new Signal()

/**
 * Connector element used to link inputs and other connectors together
 * @attribute inputs
 * @attribute outputs
 * @example <damdom-connector
 *    inputs="[document.getElementById('input1'), document.getElementById('input2')]"
 *    outputs="[document.getElementById('output1'), document.getElementById('output2')]"
 * ></damdom-connector>
 */
export default class DamdomConnector extends HTMLElement {
  #value
  #inputs
  #outputs
  #inputElementInputs
  #connectorElementInputs
  #inputElementOutputs
  #connectorElementOutputs

  /**
   * Observed Attributes
   * @private
   * @constant {Array.<String>}
   */
  static get observedAttributes() {
    return ['input', 'output', 'connected']
  }

  /**
   * Undefined type flag
   * @readonly
   * @constant {number}
   * @default 0
   */
  static get TYPE_UNDEFINED() {
    return 0
  }

  /**
   * Input type flag
   * @readonly
   * @constant {number}
   * @default 1
   */
  static get TYPE_INPUT() {
    return 1
  }

  /**
   * Output type flag
   * @readonly
   * @constant {number}
   * @default 2
   */
  static get TYPE_OUTPUT() {
    return 2
  }

  /**
   * Both type flag
   * @readonly
   * @constant {number}
   * @default 3
   */
  static get TYPE_BOTH() {
    return 3
  }

  /**
   * @abstract
   */
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <slot>
        <style>
          :host {
            display: inline-block;
            position: relative;
            width: 1em;
            height: 1em;
            margin: 3px;
          }

          :host(:not([connected])) .inside {
            visibility: hidden;
          }

          .outside {
            stroke: currentColor;
            fill: none;
            vector-effect: non-scaling-stroke;
          }

          svg {
            width: 100%;
            height: 100%;
          }
        </style>
        <svg viewBox="0 0 5 5" xmlns="http://www.w3.org/2000/svg">
          <circle cx="2.5" cy="2.5" r="1" class="inside"/>
          <circle cx="2.5" cy="2.5" r="2" stroke-dasharray="1 1" class="outside"/>
        </svg>
      </slot>
    `

    this.#inputElementInputs = new Set()
    this.#connectorElementInputs = new Set()

    this.#inputElementOutputs = new Set()
    this.#connectorElementOutputs = new Set()

    const self = this

    this.#inputs = new class extends Set {
      add(value) {
        if (this.has(value) || self === value) {
          return this
        }
        super.add(value)
        if (value.value !== undefined) {
          self.#value = value.value
        }
        if (value instanceof DamdomConnector) {
          self.#connectorElementInputs.add(value)
          value.outputs.add(self)
        } else {
          self.#inputElementInputs.add(value)
        }
        value.addEventListener('change', self.#onInputChange)
        self.#updateConnectedStatus()
        if (!(value instanceof DamdomConnector)) {
          self.dispatchEvent(new InputEvent('change'))
        }
        return this
      }
      delete(value) {
        const returnValue = super.delete(value)
        if (!returnValue) {
          return
        }
        value.removeEventListener('change', self.#onInputChange)
        if (value instanceof DamdomConnector) {
          self.#connectorElementInputs.delete(value)
          value.outputs.delete(self)
        } else {
          self.#inputElementInputs.delete(value)
        }
        self.#updateConnectedStatus()
        return returnValue
      }
      clear() {
        for (const value of this) {
          this.delete(value)
        }
      }
    }

    this.#outputs = new class extends Set {
      add(value) {
        if (this.has(value) || self === value) {
          return this
        }
        super.add(value)
        if (value instanceof DamdomConnector) {
          if (self.value !== undefined) {
            value.#value = self.value
          }
          self.#connectorElementOutputs.add(value)
          value.inputs.add(self)
          self.dispatchEvent(new CustomEvent('connected', {
            bubbles: true,
            composed: true,
            detail: {
              input: self,
              output: value,
            },
          }))
        } else {
          if (self.value !== undefined) {
            value.value = self.value
          }
          self.#inputElementOutputs.add(value)
        }
        self.#updateConnectedStatus()
        if (value instanceof DamdomConnector) {
          self.dispatchEvent(new InputEvent('change'))
        }
        return this
      }
      delete(value) {
        const returnValue = super.delete(value)
        if (!returnValue) {
          return
        }
        self.#connectorElementOutputs.delete(value)
        self.#inputElementOutputs.delete(value)
        if (value instanceof DamdomConnector) {
          value.inputs.delete(self)
        }
        self.#updateConnectedStatus()
        if (value instanceof DamdomConnector) {
          self.dispatchEvent(new CustomEvent('disconnected', {
            bubbles: true,
            composed: true,
            detail: {
              input: self,
              output: value,
            },
          }))
        }
        return returnValue
      }
      clear() {
        for (const value of this) {
          this.delete(value)
        }
      }
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return
    }

    switch (name) {
      case 'input': {
        const inputIds = newValue.split(' ')
        for (const inputId of inputIds) {
          const input = this.getRootNode().querySelector(`#${inputId}`)
          requestAnimationFrame(() => {
            if (input instanceof DamdomConnector) {
              return
            }
            if (input) {
              this.inputs.add(input)
            }
          })
        }
        break
      }
      case 'output': {
        const outputIds = newValue.split(' ')
        for (const outputId of outputIds) {
          const output = this.getRootNode().querySelector(`#${outputId}`)
          if (output) {
            requestAnimationFrame(() => {
              this.outputs.add(output)
            })
          }
        }
        break
      }
      case 'connected':
        if (!this.connected) {
          this.#connectorElementInputs.clear()
          this.#connectorElementOutputs.clear()
        }
        break
    }
  }

  #checkConnection = (connector) => {
    if (!this.getAttribute('output')) {
      return
    }
    if (this.getAttribute('output').split(' ').includes(connector.id)) {
      this.outputs.add(connector)
    }
  }

  connectedCallback() {
    CONNECTOR_ADD_SIGNAL.dispatch(this)
    CONNECTOR_ADD_SIGNAL.add(this.#checkConnection)
  }

  disconnectedCallback() {
    CONNECTOR_ADD_SIGNAL.delete(this.#checkConnection)
    if (this.type & DamdomConnector.TYPE_INPUT) {
      this.inputs.clear()
    }
    if (this.type & DamdomConnector.TYPE_OUTPUT) {
      this.outputs.clear()
    }
  }

  set connected(value) {
    if (value) {
      this.setAttribute('connected', '')
    } else {
      this.removeAttribute('connected')
    }
  }

  get connected() {
    return this.hasAttribute('connected')
  }

  #onInputChange = (event) => {
    this.#value = event.target.value
    for (const output of this.outputs) {
      if (!(output instanceof DamdomConnector)) {
        output.value = this.#value
      }
    }
    this.dispatchEvent(new InputEvent('change'))
  }

  #updateConnectedStatus() {
    this.connected = !!this.#connectorElementInputs.size || !!this.#connectorElementOutputs.size
    for (const output of this.#inputElementOutputs) {
      output.disabled = this.connected
    }
  }

  /**
   * Get current value stored in connector
   * @readonly
   */
  get value() {
    return this.#value
  }

  /**
   * Set of inputs
   * @readonly
   * @type {Set.<HTMLInputElement|DamdomConnector>}
   */
  get inputs() {
    return this.#inputs
  }

  /**
   * Set of outputs
   * @readonly
   * @type {Set.<(HTMLInputElement|DamdomConnector)>}
   */
  get outputs() {
    return this.#outputs
  }

  /**
   * Type of connector as flag
   * @readonly
   * @type {number}
   */
  get type() {
    return +!!this.#inputElementInputs.size << 1 | +!!this.#inputElementOutputs.size
  }
}

customElements.define('damdom-connector', DamdomConnector)
