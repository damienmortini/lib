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
  #selected = null;
  #elementSlotMap;
  #backButton;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <div id="highlight" class="hide">
        <slot name="highlight"></slot>
        <button id="backbutton" type="button" part="control"></button>
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

    // The wheel follows the same rule as touch gestures (see index.css): the selected
    // item takes it for itself, cancelling the page scroll, and any other item never
    // sees it, so scrolling the page past an item cannot zoom it in the background.
    // Captured, to stop it before it reaches the item; not passive, to cancel it.
    this.addEventListener('wheel', (event) => {
      if (this.#selected?.contains(event.target)) event.preventDefault();
      else if (this.#elementSlotMap.has(this.#itemOf(event.target))) event.stopPropagation();
    }, { capture: true, passive: false });

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
            <button class="deselectbutton" type="button" part="control"></button>
            <button class="highlightbutton" type="button" part="control"></button>
          `;
          // A mouse or pen selects on press, so the first drag on an item both selects
          // it and reaches it. A finger selects on tap: its press may be the start of a
          // page scroll, which the browser cancels into no click at all.
          container.addEventListener('pointerdown', (event) => {
            if (event.pointerType !== 'touch') this.selected = node;
          });
          container.addEventListener('click', () => this.selected = node);
          const deselectButton = container.querySelector('.deselectbutton');
          deselectButton.setAttribute('aria-label', `Deselect ${itemName(node)}`);
          deselectButton.title = `Deselect ${itemName(node)}`;
          // Neither its press nor its click may reach the item's own listeners, which
          // would select the item again straight after.
          deselectButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.selected = null;
          });
          deselectButton.addEventListener('pointerdown', event => event.stopPropagation());
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
          if (this.#selected === node) this.selected = null;
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

  connectedCallback() {
    // On the window: after a press on an item's canvas nothing inside the gallery holds
    // focus, so a listener on the element would never hear the key.
    window.addEventListener('keydown', this.#keydown);
    window.addEventListener('pointerdown', this.#pressOutside, { capture: true });
    window.addEventListener('click', this.#clickOutside);
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.#keydown);
    window.removeEventListener('pointerdown', this.#pressOutside, { capture: true });
    window.removeEventListener('click', this.#clickOutside);
  }

  // A click, not a press: a finger pressing to scroll the page makes no click, so
  // scrolling never deselects. A click on another item has already selected it. And
  // only a click that also began outside: a drag started inside the item and released
  // past its edge (orbiting a camera) clicks on a common ancestor.
  #pressStartedOutside = true;

  #pressOutside = (event) => {
    this.#pressStartedOutside = !this.#selected || !event.composedPath().includes(this.#containerOf(this.#selected));
  };

  #clickOutside = (event) => {
    const pressStartedOutside = this.#pressStartedOutside;
    // Spent on this click: one with no press before it (a key on a focused control)
    // counts as outside.
    this.#pressStartedOutside = true;
    if (!this.#selected || this.#highlighted || !pressStartedOutside) return;
    if (!event.composedPath().includes(this.#containerOf(this.#selected))) this.selected = null;
  };

  #keydown = (event) => {
    // An item that handled the key itself keeps it, and so does one typing into a
    // field: Escape there dismisses the field's own business. The path's first node,
    // because by the time the event reaches the window its target is retargeted to
    // the outermost shadow host.
    if (event.defaultPrevented) return;
    const origin = event.composedPath()[0];
    if (origin instanceof Element && origin.closest('input, textarea, select, [contenteditable]')) return;
    if (event.key === 'Escape' && this.#selected && !this.#highlighted) this.selected = null;
  };

  /**
   * The item the user is working with: pressed last, or expanded. Unlike `highlighted`
   * it changes nothing about the layout; it marks the item, gives it a control that
   * deselects it, and lets it keep touch gestures and the wheel to itself.
   */
  get selected() {
    return this.#selected;
  }

  set selected(value) {
    value ??= null;
    if (this.#selected === value) return;
    if (value && !this.#elementSlotMap.has(value)) throw new Error('damdom-gallery can only select one of its children');
    if (this.#selected) {
      this.#selected.toggleAttribute('selected', false);
      this.#containerOf(this.#selected)?.classList.remove('selected');
    }
    this.#selected = value;
    if (this.#selected) {
      this.#selected.toggleAttribute('selected', true);
      this.#containerOf(this.#selected)?.classList.add('selected');
    }
    this.dispatchEvent(new Event('selectchange'));
  }

  /** The child of the gallery that holds `node`, if any. */
  #itemOf(node) {
    while (node && node.parentElement !== this) node = node.parentElement;
    return node;
  }

  #containerOf(node) {
    return this.#gridContainer.querySelector(`#${this.#elementSlotMap.get(node)}`);
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
    // Expanding an item is the strongest way to pick it. Only now, so a `selectchange`
    // listener finds the highlight already in place.
    if (this.#highlighted) this.selected = this.#highlighted;
    this.dispatchEvent(new Event('highlightchange'));
  }
}

window.customElements.define('damdom-gallery', DamdomGalleryElement);
