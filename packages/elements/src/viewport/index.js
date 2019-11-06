import DragHandler from '../../../lib/src/dom/DragHandler.js';

export default class ViewportElement extends HTMLElement {
  constructor() {
    super();

    this.dragAndDropException = function (event) {
      return false;
    };

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          touch-action: none;
        }

        div {
          position: absolute;
          left: 50%;
          top: 50%;
        }

        ::slotted(*) {
          position: absolute;
          will-change: transform;
          touch-action: none;
          user-select: none;
        }
      </style>
      <div>
        <slot></slot>
      </div>
    `;

    const slot = this.shadowRoot.querySelector('slot');
    const slottedElements = new Set(slot.assignedElements({ flatten: true }));

    const dragHandler = new DragHandler();

    window.addEventListener('pointerdown', (event) => {
      if (event.composedPath()[0] !== this) {
        return;
      }
      dragHandler.drag([...slottedElements]);
    }, { passive: false });

    const startDrag = (event) => {
      if (this.dragAndDropException(event)) {
        return;
      }
      dragHandler.drag(event.currentTarget);
    };

    // Add/remove elements functions
    const addElement = (element) => {
      slottedElements.add(element);
      element.addEventListener('pointerdown', startDrag, { passive: false });
    };

    const removeElement = (element) => {
      slottedElements.delete(element);
    };

    // Initialize
    for (const element of slottedElements) {
      addElement(element);
    }

    // Observe slot change
    slot.addEventListener('slotchange', (event) => {
      const newSlottedElements = slot.assignedElements({ flatten: true });
      for (const element of newSlottedElements) {
        if (!slottedElements.has(element)) {
          addElement(element);
        }
      }
      for (const element of slottedElements) {
        if (!newSlottedElements.includes(element)) {
          removeElement(element);
        }
      }
    });

    const domRect = new DOMRect(Infinity, Infinity, 0, 0);
    for (const element of slottedElements) {
      const boundingClientRect = element.getBoundingClientRect();
      domRect.x = Math.min(domRect.x, boundingClientRect.x);
      domRect.y = Math.min(domRect.y, boundingClientRect.y);
      domRect.width = Math.max(domRect.width, boundingClientRect.x + boundingClientRect.width - domRect.x);
      domRect.height = Math.max(domRect.height, boundingClientRect.y + boundingClientRect.height - domRect.y);
    }
  }
}
