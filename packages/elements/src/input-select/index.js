export default class InputSelectElement extends HTMLElement {
  static get observedAttributes() {
    return ['options', 'value'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        select {
          width: 100%;
        }
      </style>
      <select></select>
    `;

    this._optionsMap = new Map();

    this._select = this.shadowRoot.querySelector('select');

    for (const key in HTMLSelectElement.prototype) {
      if (key in InputSelectElement.prototype) {
        continue;
      }
      Object.defineProperty(this, key, {
        get() {
          return this._select[key];
        },
        set(value) {
          this._select[key] = value;
        },
      });
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    switch (name) {
      case 'options':
        const values = new Function(`return ${newValue}`).apply(this);
        this[name] = values;
        break;
      case 'value':
        this.value = new Function(`return ${newValue}`).apply(this);
        break;
    }
  }

  get options() {
    return this._options;
  }

  set options(value) {
    this._options = value;
    this._select.innerHTML = '';
    this._optionsMap.clear();
    for (const option of this._options) {
      const optionElement = document.createElement('option');
      const stringifiedOption = typeof option === 'object' ? JSON.stringify(option) : option.toString();
      optionElement.value = stringifiedOption;
      optionElement.text = stringifiedOption;
      optionElement.selected = option === this.value;
      this._select.add(optionElement);
      this._optionsMap.set(stringifiedOption, option);
    }
    this.value = this._value;
  }

  get value() {
    return this._optionsMap.get(this._select.value);
  }

  set value(value) {
    this._value = value;
    this._select.value = value;
  }
}
