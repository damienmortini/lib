import style from './index.css' with { type: 'css' };

class DamdomGalleryElement extends HTMLElement {
  #highlightContainer;
  #gridContainer;
  #highlighted = null;
  #elementSlotMap;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <div id="highlight" class="hide">
        <slot name="highlight"></slot>
        <div id="backbutton"></div>
      </div>
      <div id="grid" part="grid"></div>
    `;
    this.shadowRoot.adoptedStyleSheets = [style];

    this.#highlightContainer = this.shadowRoot.querySelector('#highlight');
    this.#gridContainer = this.shadowRoot.querySelector('#grid');
    const backButton = this.shadowRoot.querySelector('#backbutton');

    const highlightButtonClick = (event) => {
      for (const [element, id] of this.#elementSlotMap) {
        if (id === event.target.parentElement.id) {
          this.highlighted = element;
        }
      }
    };

    const backButtonClick = () => {
      this.highlighted = null;
    };

    backButton.addEventListener('click', backButtonClick);

    let slotUID = 0;
    this.#elementSlotMap = new Map();
    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          const slotName = `gallery-item-${slotUID++}`;
          const container = document.createElement('div');
          container.part = 'item';
          container.classList.add('elementcontainer');
          container.id = slotName;
          container.innerHTML = `
            <slot name="${slotName}"></slot>
            <div class="highlightbutton"></div>
          `;
          container.querySelector('.highlightbutton').addEventListener('click', highlightButtonClick);
          node.slot = this.#highlighted === node ? 'highlight' : slotName;
          this.#elementSlotMap.set(node, slotName);
          this.#gridContainer.appendChild(container);
        }
        for (const node of mutation.removedNodes) {
          node.slot = '';
          const container = this.#gridContainer.querySelector(`#${this.#elementSlotMap.get(node)}`);
          container.querySelector('.highlightbutton').removeEventListener('click', highlightButtonClick);
          container.remove();
          this.#elementSlotMap.delete(node);
        }
      }
    };
    mutationCallback([
      {
        addedNodes: this.children,
        removedNodes: [],
      },
    ]);
    const observer = new MutationObserver(mutationCallback);
    observer.observe(this, { childList: true });
  }

  get highlighted() {
    return this.#highlighted;
  }

  set highlighted(value) {
    if (this.#highlighted === value) return;
    if (this.#highlighted) {
      this.#highlighted.slot = `${this.#elementSlotMap.get(this.#highlighted)}`;
      this.#highlighted.toggleAttribute('highlighted', false);
    }
    this.#highlighted = value;
    if (this.#highlighted) {
      this.#highlighted.slot = 'highlight';
      this.#highlighted.toggleAttribute('highlighted', true);
      this.#highlightContainer.classList.remove('hide');
      this.#gridContainer.classList.add('hide');
    }
    else {
      this.#highlightContainer.classList.add('hide');
      this.#gridContainer.classList.remove('hide');
    }
    this.dispatchEvent(new Event('highlightchange'));
  }
}

window.customElements.define('damdom-gallery', DamdomGalleryElement);
