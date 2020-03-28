export default class GUIFolderElement extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'close'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          font-family: sans-serif;
        }
        :host(::-webkit-scrollbar ){ 
          background: transparent;
          width: 4px;
        }
        :host(::-webkit-scrollbar-thumb) { 
          background: rgba(1, 1, 1, .1);
        }
        details, slot, summary {
          padding: 5px;
        }
        summary:focus {
          outline: none;
        }
        section {
          margin: 5px 0;
        }
        section.input {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        section.input .input {
          flex: 3;
          min-width: 50%;
          text-align: center;
        }
        section.input label {
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 5px;
          flex: 1;
        }
        section.input label:empty {
          display: none;
        }
      </style>
      <slot></slot>
      <details>
        <summary></summary>
      </details>
    `;

    this._details = this.shadowRoot.querySelector('details');
    this._summary = this.shadowRoot.querySelector('summary');

    let slotUID = 0;
    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          const slotName = `node-slot-${++slotUID}`;
          if (!('value' in node)) {
            const slot = document.createElement('slot');
            slot.name = slotName;
            this._details.appendChild(slot);
          } else {
            const label = node.getAttribute('label') || node.label || node.getAttribute('name') || node.name || node.id || '';
            const section = document.createElement('section');
            section.id = slotName;
            section.classList.add('input');
            section.innerHTML = `
              <label title="${label}">${label}</label>
              <div class="input"><slot name="${slotName}"></slot></div>
            `;
            this._details.appendChild(section);
          }
          node.slot = slotName;
        }
        for (const node of mutation.removedNodes) {
          const section = this.shadowRoot.querySelector(`section#${node.slot}`)
          if (section) {
            section.remove();
          };
        }
      }
    };
    mutationCallback([{
      addedNodes: this.children,
      removedNodes: [],
    }]);
    const observer = new MutationObserver(mutationCallback);
    observer.observe(this, { childList: true });

    this._summary.addEventListener('click', (event) => {
      event.preventDefault();
      if (event.target !== event.currentTarget) {
        return;
      }
      this.close = !this.close;
    });

    this._details.addEventListener('toggle', (event) => {
      this.close = !event.target.open;
      this.dispatchEvent(new Event(event.type, event));
    });
  }

  connectedCallback() {
    this._details.open = !this.close;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'name':
        this._summary.textContent = newValue;
        break;
      case 'close':
        this._details.open = !this.close;
        break;
    }
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
