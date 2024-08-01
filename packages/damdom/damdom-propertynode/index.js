import '@damienmortini/damdom-linkableconnector/index.js';

export class GraphPropertyNodeElement extends HTMLElement {
  #value;
  #valueElement;
  #idElement;

  static get observedAttributes() {
    return ['id'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          background: lightgrey;
          border-radius: 4px;
          padding: 5px 10px;
          box-sizing: border-box;
          user-select: none;
        }
      </style>
      <span id="id"></span><damdom-linkableconnector></damdom-linkableconnector>
    `;
    this.#idElement = this.shadowRoot.querySelector('#id');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'id':
        this.#idElement.textContent = newValue;
        break;
    }
  }

  get value() {
    return this.#value;
  }

  set value(value) {
    this.#value = value;
  }
}

window.customElements.define('damdom-propertynode', GraphPropertyNodeElement);
