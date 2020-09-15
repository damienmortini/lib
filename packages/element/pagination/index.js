/**
 * Entry point element
 * @hideconstructor
 * @example
 * <element-pagination></element-pagination>
 */
window.customElements.define('damo-pagination', class extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `<style>
  :host {
    display: grid;
    position: relative;
    contain: content;
    justify-content: center;
    align-items: center;
  }
</style>
<slot></slot>`;

    this._selectedIndex = 0;
    this._slottedElements = [];

    const slot = this.shadowRoot.querySelector('slot');

    const onClick = (event) => {
      this.selected = event.currentTarget;
    };

    slot.addEventListener('slotchange', () => {
      for (const slottedElement of this._slottedElements) {
        slottedElement.removeEventListener('click', onClick);
      }
      this._slottedElements = slot.assignedElements({ flatten: true });
      for (const slottedElement of this._slottedElements) {
        slottedElement.addEventListener('click', onClick);
      }
    });
  }

  get options() {
    return this._slottedElements;
  }

  get selected() {
    return this._slottedElements[this._selectedIndex];
  }

  set selected(value) {
    this._selected = value;
    this.selectedIndex = this._slottedElements.indexOf(this._selected);
  }

  get selectedIndex() {
    return this._selectedIndex;
  }

  set selectedIndex(value) {
    value = Math.max(0, Math.min(value, this.options.length - 1));
    if (value === this._selectedIndex) {
      return;
    }
    this._selectedIndex = value;
    for (const [index, slottedElement] of this._slottedElements.entries()) {
      slottedElement.toggleAttribute('selected', index === this._selectedIndex);
    }
    this.dispatchEvent(new Event('paginationchange'));
  }
});
