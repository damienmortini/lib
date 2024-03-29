import css from './index.css' with { type: 'css' };

export class DamdomConnectorElement extends HTMLElement {
  #in;
  #out;
  #slot;
  #value;
  #inputs = new Set();
  #connectors = new Set();

  static get observedAttributes() {
    return ['connect'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [css];
    this.shadowRoot.innerHTML = `
      <div id="in" tabindex="-1" part="connector" class="connector"></div>
      <slot></slot>
      <div id="out" tabindex="-1" part="connector" class="connector"></div>
    `;

    this.#in = this.shadowRoot.querySelector('#in');
    this.#out = this.shadowRoot.querySelector('#out');

    this.addEventListener('change', this.#onInputChange);
    this.addEventListener('input', this.#onInputChange);

    this.#slot = this.shadowRoot.querySelector('slot');
    this.#slot.addEventListener('slotchange', () => {
      this.#inputs.clear();
      for (const node of this.#slot.assignedNodes({ flatten: true })) {
        if ('value' in node) this.#inputs.add(node);
      }
    });

    this.#in.addEventListener('pointerdown', () => {
      this.dispatchEvent(
        new Event('connectorselected', {
          composed: true,
          bubbles: true,
        }),
      );
    });
    this.#out.addEventListener('pointerdown', () => {
      this.dispatchEvent(
        new Event('connectorselected', {
          composed: true,
          bubbles: true,
        }),
      );
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    switch (name) {
      case 'connect': {
        (async () => {
          await customElements.whenDefined('damdom-connector');
          const connectorIds = newValue.split(' ') ?? [];
          for (const connectorId of connectorIds) {
            const input = this.getRootNode().querySelector(`#${connectorId}`);
            if (!input) continue;
            this.connect(input);
          }
        })();
        break;
      }
    }
  }

  #onInputChange = (event) => {
    this.value = event.target.value;
  };

  connect(connector) {
    this.#connectors.add(connector);
    connector.value = this.value;
  }

  disconnect(connector) {
    this.#connectors.delete(connector);
  }

  get value() {
    return this.#value;
  }

  set value(value) {
    this.#value = value;
    for (const input of this.#inputs) {
      input.value = value;
    }
    for (const connector of this.#connectors) {
      connector.value = value;
    }
  }
}

customElements.define('damdom-connector', DamdomConnectorElement);
