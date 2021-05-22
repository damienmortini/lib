export default class GUIFolderElement extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'open'];
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
        details {
          padding: 0 10px;
        }
        summary {
          padding: 5px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        summary:focus {
          outline: none;
        }
        #content {
          display: grid;
          align-items: center;
          grid-template-columns: minmax(auto, 1fr) 2fr;
          gap: 5px;
        }
        section {
          display: contents;
        }
        slot::slotted(*) {
          width: 100%;
          grid-column: span 2;
        }
        section.input slot::slotted(*) {
          width: 100%;
          grid-column: span 1;
        }
        section.input label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        section.input label:empty {
          display: none;
        }
        section.input label:empty + slot::slotted(*) {
          grid-column: span 2;
        }
      </style>
      <slot></slot>
      <details>
        <summary></summary>
        <div id="content"></div>
      </details>
    `;

    this._details = this.shadowRoot.querySelector('details');
    this._summary = this.shadowRoot.querySelector('summary');
    this._content = this.shadowRoot.querySelector('#content');

    let slotUID = 0;
    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          const slotName = `node-slot-${++slotUID}`;
          if (!('value' in node)) {
            const slot = document.createElement('slot');
            slot.name = slotName;
            this._content.appendChild(slot);
          } else {
            const label = node.getAttribute('label') || node.label || node.getAttribute('name') || node.name || node.id || '';
            const section = document.createElement('section');
            section.id = slotName;
            section.classList.add('input');
            section.innerHTML = `
              <label title="${label}">${label}</label>
              <slot name="${slotName}"></slot>
            `;
            this._content.appendChild(section);
          }
          node.slot = slotName;
        }
        for (const node of mutation.removedNodes) {
          const section = this.shadowRoot.querySelector(`section#${node.slot}`);
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

    this._details.addEventListener('toggle', (event) => {
      this.open = event.target.open;
      this.dispatchEvent(new Event(event.type, event));
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'name':
        this._summary.textContent = newValue;
        this._summary.title = newValue;
        break;
      case 'open':
        this._details.open = newValue !== null;
        break;
    }
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    this.toggleAttribute('open', value);
  }

  get name() {
    return this.getAttribute('name');
  }

  set name(value) {
    this.setAttribute('name', value);
  }
}
