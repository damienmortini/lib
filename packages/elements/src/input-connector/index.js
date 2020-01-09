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
    return ['input', 'output', 'connected'];
  }

  /**
   * Undefined type flag
   * @readonly
   * @constant {number}
   * @default 0
   */
  static get TYPE_UNDEFINED() {
    return 0;
  }

  /**
   * Input type flag
   * @readonly
   * @constant {number}
   * @default 1
   */
  static get TYPE_INPUT() {
    return 1;
  }

  /**
   * Output type flag
   * @readonly
   * @constant {number}
   * @default 2
   */
  static get TYPE_OUTPUT() {
    return 2;
  }

  /**
   * Both type flag
   * @readonly
   * @constant {number}
   * @default 3
   */
  static get TYPE_BOTH() {
    return 3;
  }

  /**
   * @abstract
   */
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <slot>
        <style>
          :host {
            display: inline-block;
            position: relative;
            width: .8em;
            height: .8em;
            margin: .2em;
          }

          :host(:not([connected])) .inside {
            visibility: hidden;
          }

          .inside {
            position: absolute;
            margin: auto;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            width: 50%;
            height: 50%;
            background: currentColor;
            border-radius: 50%;
          }

          .outside {
            width: 100%;
            height: 100%;
            border: 1px dotted;
            border-radius: 50%;
            box-sizing: border-box;
          }
        </style>
        <div class="inside"></div>
        <div class="outside"></div>
      </slot>
    `;

    this._onInputChangeBinded = this._onInputChange.bind(this);
    this._checkConnectionBinded = this._checkConnection.bind(this);

    this._inputElementInputs = new Set();
    this._connectorElementInputs = new Set();

    this._inputElementOutputs = new Set();
    this._connectorElementOutputs = new Set();

    const self = this;

    this._inputs = new class extends Set {
      add(value) {
        if (this.has(value) || self === value) {
          return this;
        }
        super.add(value);
        if (value.value !== undefined) {
          self._value = value.value;
        }
        if (value instanceof InputConnectorElement) {
          self._connectorElementInputs.add(value);
          value.outputs.add(self);
        } else {
          self._inputElementInputs.add(value);
        }
        value.addEventListener('input', self._onInputChangeBinded);
        self._updateConnectedStatus();
        if (!(value instanceof InputConnectorElement)) {
          self.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            composed: true,
          }));
        }
        return this;
      }
      delete(value) {
        const returnValue = super.delete(value);
        if (!returnValue) {
          return;
        }
        value.removeEventListener('input', self._onInputChangeBinded);
        if (value instanceof InputConnectorElement) {
          self._connectorElementInputs.delete(value);
          value.outputs.delete(self);
        } else {
          self._inputElementInputs.delete(value);
        }
        self._updateConnectedStatus();
        return returnValue;
      }
      clear() {
        for (const value of this) {
          this.delete(value);
        }
      }
    };

    this._outputs = new class extends Set {
      add(value) {
        if (this.has(value) || self === value) {
          return this;
        }
        super.add(value);
        if (value instanceof InputConnectorElement) {
          self._connectorElementOutputs.add(value);
          value.inputs.add(self);
          self.dispatchEvent(new CustomEvent('connected', {
            bubbles: true,
            composed: true,
            detail: {
              output: value,
            },
          }));
        } else {
          self._inputElementOutputs.add(value);
        }
        self._updateConnectedStatus();
        if (value instanceof InputConnectorElement) {
          self.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            composed: true,
          }));
        }
        return this;
      }
      delete(value) {
        const returnValue = super.delete(value);
        if (!returnValue) {
          return;
        }
        self._connectorElementOutputs.delete(value);
        self._inputElementOutputs.delete(value);
        if (value instanceof InputConnectorElement) {
          value.inputs.delete(self);
        }
        self._updateConnectedStatus();
        if (value instanceof InputConnectorElement) {
          self.dispatchEvent(new CustomEvent('disconnected', {
            bubbles: true,
            composed: true,
            detail: {
              output: value,
            },
          }));
        }
        return returnValue;
      }
      clear() {
        for (const value of this) {
          this.delete(value);
        }
      }
    };
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    switch (name) {
      case 'input':
        const inputIds = newValue.split(' ');
        for (const inputId of inputIds) {
          const input = this.getRootNode().querySelector(`#${inputId}`);
          requestAnimationFrame(() => {
            if (input instanceof InputConnectorElement) {
              return;
            }
            this.inputs.add(input);
          });
        }
        break;
      case 'output':
        const outputIds = newValue.split(' ');
        for (const outputId of outputIds) {
          const output = this.getRootNode().querySelector(`#${outputId}`);
          requestAnimationFrame(() => {
            if (output instanceof InputConnectorElement) {
              return;
            }
            this.outputs.add(output);
          });
        }
        // const array = new Function(`return ${newValue}`).apply(this);
        // for (const value of array) {
        //   this[name].add(value);
        // }
        break;
      case 'connected':
        if (!this.connected) {
          this._connectorElementInputs.clear();
          this._connectorElementOutputs.clear();
        }
        break;
    }
  }

  _checkConnection(event) {
    if (!(event.detail instanceof InputConnectorElement)) {
      return;
    }
    if (!this.getAttribute('output')) {
      return;
    }
    if (this.getAttribute('output').split(' ').includes(event.detail.id)) {
      this.outputs.add(event.detail);
    }
  }

  connectedCallback() {
    this.dispatchEvent(new CustomEvent('connectoradd', {
      bubbles: true,
      composed: true,
      detail: this,
    }));
    window.addEventListener('connectoradd', this._checkConnectionBinded);
  }

  disconnectedCallback() {
    window.removeEventListener('connectoradd', this._checkConnectionBinded);
    if (this.type & InputConnectorElement.TYPE_INPUT) {
      this.inputs.clear();
    }
    if (this.type & InputConnectorElement.TYPE_OUTPUT) {
      this.outputs.clear();
    }
  }

  set connected(value) {
    if (value) {
      this.setAttribute('connected', '');
    } else {
      this.removeAttribute('connected');
    }
  }

  get connected() {
    return this.hasAttribute('connected');
  }

  _onInputChange(event) {
    this._value = event.target.value;
    for (const output of this.outputs) {
      if (!(output instanceof InputConnectorElement)) {
        output.value = this._value;
      }
    }
    this.dispatchEvent(new event.constructor(event.type, event));
  }

  _updateConnectedStatus() {
    this.connected = !!this._connectorElementInputs.size || !!this._connectorElementOutputs.size;
    for (const output of this._inputElementOutputs) {
      output.disabled = this.connected;
    }
  }

  /**
   * Get current value stored in connector
   * @readonly
   */
  get value() {
    return this._value;
  }

  /**
   * Set of inputs
   * @readonly
   * @type {Set.<HTMLInputElement|InputConnectorElement>}
   */
  get inputs() {
    return this._inputs;
  }

  /**
   * Set of outputs
   * @readonly
   * @type {Set.<(HTMLInputElement|InputConnectorElement)>}
   */
  get outputs() {
    return this._outputs;
  }

  /**
   * Type of connector as flag
   * @readonly
   * @type {number}
   */
  get type() {
    return +!!this._inputElementInputs.size << 1 | +!!this._inputElementOutputs.size;
  }
}

export default InputConnectorElement;
