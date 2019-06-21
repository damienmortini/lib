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
    return ["inputs", "outputs"];
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

    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host {
          display: inline-block;
          cursor: pointer;
        }
        input {
          cursor: pointer;
          display: inline-block;
          margin: 5px;
        }
      </style>
      <input type="radio" disabled>
      <slot></slot>
    `;

    this._radio = this.shadowRoot.querySelector("input");

    this._onInputChangeBinded = this._onInputChange.bind(this);

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
          value.addEventListener("input", self._onInputChangeBinded);
        }
        self._updateConnectedStatus();
        return this;
      }
      delete(value) {
        const returnValue = super.delete(value);
        if (!returnValue) {
          return;
        }
        value.removeEventListener("input", self._onInputChangeBinded);
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
          self.dispatchEvent(new CustomEvent("connected", {
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
        if (self._value !== undefined) {
          value.value = self._value;
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
          self.dispatchEvent(new CustomEvent("disconnected", {
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

    name = name.replace("data-", "");

    const array = new Function(`return ${newValue}`).apply(this);
    for (const value of array) {
      this[name].add(value);
    }
  }

  disconnectedCallback() {
    if (this.type & InputConnectorElement.TYPE_INPUT) {
      this.inputs.clear();
    }
    if (this.type & InputConnectorElement.TYPE_OUTPUT) {
      this.outputs.clear();
    }
  }

  _onInputChange(event) {
    this.value = event.target.value;
  }

  _updateConnectedStatus() {
    this._radio.checked = !!this._connectorElementInputs.size || !!this._connectorElementOutputs.size;
    for (const output of this._inputElementOutputs) {
      output.disabled = this._radio.checked;
    }
  }

  /**
   * Value inputted, automatically set on input change but can be set manually
   * @param {any} value
   */
  set value(value) {
    this._value = value;
    for (const output of this.outputs) {
      const oldValue = output.value;
      output.value = value;
      if (!(output instanceof InputConnectorElement) && oldValue !== value) {
        output.dispatchEvent(new Event("input", {
          bubbles: true,
        }));
        output.dispatchEvent(new Event("change", {
          bubbles: true,
        }));
      }
    }
  }

  /**
   * Return true if connected to another connector
   * @readonly
   * @type {boolean}
   */
  get connected() {
    return this._radio.checked;
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
