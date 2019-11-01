if (!customElements.get('node-input-connector')) {
  import('../input-connectorlink/index.js').then((module) => {
    customElements.define('node-input-connector', module.default);
  });
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
          overflow: auto;
          resize: horizontal;
          border: 1px dotted;
          background: rgba(255, 255, 255, .9);
        }
        :host(:hover) {
          border: 1px dashed;
        }
        :host(:focus-within) {
          border: 1px solid;
          z-index: 1;
        }
        .content, slot {
          padding: 5px;
        }
        details summary {
          position: relative;
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
      <node-input-connector></node-input-connector>
      <label title="${label}">${label}</label>
      <div class="input"><slot name="${slotUID}"></slot></div>
      <node-input-connector></node-input-connector>
    `;
    const connectors = section.querySelectorAll('node-input-connector');
    if (connectors[0].outputs) {
      connectors[0].outputs.add(node);
    }
    if (connectors[0].inputs) {
      connectors[1].inputs.add(node);
    }
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
