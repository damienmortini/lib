import DragHandler from '../../../lib/src/dom/DragHandler.js';

export default class ViewportElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          touch-action: none;
        }

        ::slotted(*) {
          position: absolute;
          will-change: transform;
          touch-action: none;
          user-select: none;
        }
      </style>
      <slot></slot>
    `;

    const slot = this.shadowRoot.querySelector('slot');
    const slottedElements = new Set(slot.assignedElements({ flatten: true }));

    // Drag handlers
    const dragHandler = new DragHandler({
      elements: [this],
      exceptions: [
        (nodes) => {
          return nodes[0] !== this;
        },
      ],
    });
    this._childrenDragHandler = new DragHandler();

    // Add/remove elements functions
    const addElement = (element) => {
      slottedElements.add(element);
      dragHandler.add(element);
      this._childrenDragHandler.add(element);
    };

    const removeElement = (element) => {
      slottedElements.delete(element);
      dragHandler.delete(element);
      this._childrenDragHandler.delete(element);
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
  }

  get childrenDragAndDropExceptions() {
    return this._childrenDragHandler.exceptions;
  }

  set childrenDragAndDropExceptions(value) {
    this._childrenDragHandler.exceptions = value;
  }
}
