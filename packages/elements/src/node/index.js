import ConnectorInputLinkableElement from '../connector-input-linkable/index.js';

if (!customElements.get('node-connector-input')) {
  customElements.define('node-connector-input', ConnectorInputLinkableElement);
}

let slotUID = 0;

/**
 * Node Element
 */
export default class NodeElement extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'close'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          border: 1px dotted;
          background: rgba(255, 255, 255, .9);
          resize: horizontal;
        }
        :host(:hover) {
          border: 1px dashed;
        }
        :host(:focus-within) {
          border: 1px solid;
          z-index: 1;
        }
        .content, slot {
          padding: 10px;
        }
        details summary {
          pointer-events: none;
          padding: 5px;
        }
        details summary:focus {
          outline: none;
        }
        section.input {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        section.input .input {
          flex: 2;
          min-width: 50%;
          text-align: center;
        }
        section.input label {
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 5px;
          white-space: nowrap;
          flex: 1;
        }
        section.input label:empty {
          display: none;
        }
      </style>
      <details class="content">
        <summary></summary>
      </details>
    `;

    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          if (!('value' in node)) {
            const section = document.createElement('section');
            section.id = `slot${slotUID}`;
            section.innerHTML = `<slot name="${slotUID}"></slot>`;
            this.shadowRoot.querySelector('.content').appendChild(section);
            node.slot = slotUID;
            slotUID++;
          }
          this._addInput(node);
        }
        for (const node of mutation.removedNodes) {
          this.shadowRoot.querySelector(`section#slot${node.slot}`).remove();
        }
      }
    });
    observer.observe(this, { childList: true });

    this.shadowRoot.querySelector('details').addEventListener('toggle', (event) => {
      this.close = !event.target.open;
      this.dispatchEvent(new Event(event.type, event));
    });

    this.addEventListener('dblclick', (event) => {
      this.close = !this.close;
    });
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.content').open = !this.close;
    for (const child of this.children) {
      if (!('value' in child)) {
        continue;
      }
      this._addInput(child);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'name':
        this.shadowRoot.querySelector('.content').querySelector('summary').textContent = newValue;
        break;
      case 'close':
        this.shadowRoot.querySelector('.content').open = !this.close;
        break;
    }
  }

  _addInput(node) {
    if (this.shadowRoot.querySelector(`slot[name="${node.slot}"]`)) {
      return;
    }
    const label = node.getAttribute('label') || node.getAttribute('name') || node.id || '';
    const section = document.createElement('section');
    section.id = `slot${slotUID}`;
    section.classList.add('input');
    section.innerHTML = `
      <node-connector-input></node-connector-input>
      <label title="${label}">${label}</label>
      <div class="input"><slot name="${slotUID}"></slot></div>
      <node-connector-input></node-connector-input>
    `;
    const connectors = section.querySelectorAll('node-connector-input');
    connectors[0].outputs.add(node);
    connectors[1].inputs.add(node);
    this.shadowRoot.querySelector('.content').appendChild(section);
    node.slot = slotUID;
    slotUID++;
  }

  set close(value) {
    if (value) {
      this.setAttribute('close', '');
    } else {
      this.removeAttribute('close');
    }
  }

  get close() {
    return this.hasAttribute('close');
  }

  get name() {
    return this.getAttribute('name');
  }

  set name(value) {
    this.setAttribute('name', value);
  }
}
