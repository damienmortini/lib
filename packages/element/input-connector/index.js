import Signal from '../../core/util/Signal.js'

const CONNECTOR_ADD_SIGNAL = new Signal()

/**
 * Connector element used to link inputs and other connectors together
 * @attribute inputs
 * @attribute outputs
 * @example <graph-connector
 *    inputs="[document.getElementById('input1'), document.getElementById('input2')]"
 *    outputs="[document.getElementById('output1'), document.getElementById('output2')]"
 * ></graph-connector>
 */
class InputConnectorElement extends HTMLElement {
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

    this._onInputChangeBound = this._onInputChange.bind(this)
    this._checkConnectionBound = this._checkConnection.bind(this)

    this._inputElementInputs = new Set()
    this._connectorElementInputs = new Set()

    this._inputElementOutputs = new Set()
    this._connectorElementOutputs = new Set()

    const self = this

    this._inputs = new class extends Set {
      add(value) {
        if (this.has(value) || self === value) {
          return this
        }
        super.add(value)
        if (value.value !== undefined) {
          self._value = value.value
        }
        if (value instanceof InputConnectorElement) {
          self._connectorElementInputs.add(value)
          value.outputs.add(self)
        } else {
          self._inputElementInputs.add(value)
        }
        value.addEventListener('input', self._onInputChangeBound)
        self._updateConnectedStatus()
        if (!(value instanceof InputConnectorElement)) {
          self.dispatchEvent(new InputEvent('input'))
        }
        return this
      }
      delete(value) {
        const returnValue = super.delete(value)
        if (!returnValue) {
          return
        }
        value.removeEventListener('input', self._onInputChangeBound)
        if (value instanceof InputConnectorElement) {
          self._connectorElementInputs.delete(value)
          value.outputs.delete(self)
        } else {
          self._inputElementInputs.delete(value)
        }
        self._updateConnectedStatus()
        return returnValue
      }
      clear() {
        for (const value of this) {
          this.delete(value)
        }
      }
    }

    this._outputs = new class extends Set {
      add(value) {
        if (this.has(value) || self === value) {
          return this
        }
        super.add(value)
        if (value instanceof InputConnectorElement) {
          if (self.value !== undefined) {
            value._value = self.value
          }
          self._connectorElementOutputs.add(value)
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
          self._inputElementOutputs.add(value)
        }
        self._updateConnectedStatus()
        if (value instanceof InputConnectorElement) {
          self.dispatchEvent(new InputEvent('input'))
        }
        return this
      }
      delete(value) {
        const returnValue = super.delete(value)
        if (!returnValue) {
          return
        }
        self._connectorElementOutputs.delete(value)
        self._inputElementOutputs.delete(value)
        if (value instanceof InputConnectorElement) {
          value.inputs.delete(self)
        }
        self._updateConnectedStatus()
        if (value instanceof InputConnectorElement) {
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
      case 'input':
        const inputIds = newValue.split(' ')
        for (const inputId of inputIds) {
          const input = this.getRootNode().querySelector(`#${inputId}`)
          requestAnimationFrame(() => {
            if (input instanceof InputConnectorElement) {
              return
            }
            if (input) {
              this.inputs.add(input)
            }
          })
        }
        break
      case 'output':
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
      case 'connected':
        if (!this.connected) {
          this._connectorElementInputs.clear()
          this._connectorElementOutputs.clear()
        }
        break
    }
  }

  _checkConnection(connector) {
    if (!this.getAttribute('output')) {
      return
    }
    if (this.getAttribute('output').split(' ').includes(connector.id)) {
      this.outputs.add(connector)
    }
  }

  connectedCallback() {
    CONNECTOR_ADD_SIGNAL.dispatch(this)
    CONNECTOR_ADD_SIGNAL.add(this._checkConnectionBound)
  }

  disconnectedCallback() {
    CONNECTOR_ADD_SIGNAL.delete(this._checkConnectionBound)
    if (this.type & InputConnectorElement.TYPE_INPUT) {
      this.inputs.clear()
    }
    if (this.type & InputConnectorElement.TYPE_OUTPUT) {
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

  _onInputChange(event) {
    this._value = event.target.value
    for (const output of this.outputs) {
      if (!(output instanceof InputConnectorElement)) {
        output.value = this._value
      }
    }
    this.dispatchEvent(new InputEvent('input'))
  }

  _updateConnectedStatus() {
    this.connected = !!this._connectorElementInputs.size || !!this._connectorElementOutputs.size
    for (const output of this._inputElementOutputs) {
      output.disabled = this.connected
    }
  }

  /**
   * Get current value stored in connector
   * @readonly
   */
  get value() {
    return this._value
  }

  /**
   * Set of inputs
   * @readonly
   * @type {Set.<HTMLInputElement|InputConnectorElement>}
   */
  get inputs() {
    return this._inputs
  }

  /**
   * Set of outputs
   * @readonly
   * @type {Set.<(HTMLInputElement|InputConnectorElement)>}
   */
  get outputs() {
    return this._outputs
  }

  /**
   * Set of input elements (non connector) only
   * @readonly
   * @type {Set.<HTMLInputElement>}
   */
  get inputElements() {
    return this._inputElementInputs
  }

  /**
   * Set of output elements (non connector) only
   * @readonly
   * @type {Set.<(HTMLInputElement)>}
   */
  get outputElements() {
    return this._inputElementOutputs
  }

  /**
   * Type of connector as flag
   * @readonly
   * @type {number}
   */
  get type() {
    return +!!this._inputElementInputs.size << 1 | +!!this._inputElementOutputs.size
  }
}

export default InputConnectorElement
