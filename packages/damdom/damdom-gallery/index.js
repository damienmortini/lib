import style from './index.css' with { type: 'css' };

// A gallery holds several items, so every control has to say which item it acts on:
// repeating one name across them leaves a screen reader announcing the same button
// over and over. The item itself is the only thing that knows what it is.
// `||` rather than `??`: an item carrying an empty label names nothing, so the
// tag name is a better answer than a control announced as "Expand".
const itemName = node => node.getAttribute('aria-label') || node.getAttribute('title') || node.localName;

class DamdomGalleryElement extends HTMLElement {
  #highlightContainer;
  #gridContainer;
  #highlighted = null;
  #elementSlotMap;
  #backButton;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <div id="highlight" class="hide">
        <slot name="highlight"></slot>
        <button id="backbutton" type="button"></button>
      </div>
      <div id="grid" part="grid"></div>
    `;
    this.shadowRoot.adoptedStyleSheets = [style];

    this.#highlightContainer = this.shadowRoot.querySelector('#highlight');
    this.#gridContainer = this.shadowRoot.querySelector('#grid');
    this.#backButton = this.shadowRoot.querySelector('#backbutton');

    const highlightButtonClick = (event) => {
      for (const [element, id] of this.#elementSlotMap) {
        if (id === event.target.parentElement.id) {
          this.highlighted = element;
          // Only a click moves focus: a page highlighting an item itself — from a
          // route or a hash — must not take focus away from wherever the user is.
          this.#backButton.focus({ preventScroll: true });
          break;
        }
      }
    };

    const backButtonClick = () => {
      const slotName = this.#elementSlotMap.get(this.#highlighted);
      this.highlighted = null;
      this.#gridContainer.querySelector(`#${slotName}`)?.querySelector('button')?.focus();
    };

    this.#backButton.addEventListener('click', backButtonClick);

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
            <button class="highlightbutton" type="button"></button>
          `;
          const highlightButton = container.querySelector('.highlightbutton');
          // Set rather than interpolated: a name taken off the item is its content,
          // and markup built from it would run whatever that content happens to be.
          const label = `Expand ${itemName(node)}`;
          highlightButton.setAttribute('aria-label', label);
          highlightButton.title = label;
          highlightButton.addEventListener('click', highlightButtonClick);
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
      // Named here rather than beside the click that usually causes it: the property
      // is public, so a page highlighting an item itself gets the same named control.
      const label = `Collapse ${itemName(this.#highlighted)}`;
      this.#backButton.setAttribute('aria-label', label);
      this.#backButton.title = label;
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
