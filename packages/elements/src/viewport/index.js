import DragHandler from '../../../lib/src/dom/DragHandler.js';

export default class ViewportElement extends HTMLElement {
  static get observedAttributes() {
    return ['draggable', 'zoomable'];
  }

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

    this._childrenDragHandler = new DragHandler();

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          this._childrenDragHandler.add(node);
        }
        for (const node of mutation.removedNodes) {
          this._childrenDragHandler.delete(node);
        }
      }
    });
    observer.observe(this, { childList: true });

    for (const child of this.children) {
      if (child instanceof HTMLSlotElement) {
        for (const element of child.assignedElements()) {
          this._childrenDragHandler.add(element);
          child.addEventListener('slotchange', (event) => {
            for (const element of event.target.assignedElements()) {
              this._childrenDragHandler.add(element);
            }
          });
          observer.observe(element.parentElement, { childList: true });
        }
      } else {
        this._childrenDragHandler.add(child);
      }
    }

    // this._zoomable = this.shadowRoot.querySelector('graph-zoomable');
    // this._draggable = this.shadowRoot.querySelector('graph-draggable');

    // this._zoomable.addEventListener('zoom', () => {
    //   this._draggable.dragFactor = 1 / this._zoomable.zoom;
    // });
  }

  get childrenDragAndDropExceptions() {
    return this._childrenDragHandler.exceptions;
  }

  set childrenDragAndDropExceptions(value) {
    this._childrenDragHandler.exceptions = value;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'draggable':
        // this._draggable.disabled = !newValue;
        break;
      case 'zoomable':
        // this._zoomable.disabled = !newValue;
        break;
    }
  }

  get zoomable() {
    return this.hasAttribute('zoomable');
  }

  set zoomable(value) {
    if (value) {
      this.setAttribute('zoomable', '');
    } else {
      this.removeAttribute('zoomable');
    }
  }

  get draggable() {
    return this.hasAttribute('draggable');
  }

  set draggable(value) {
    if (value) {
      this.setAttribute('draggable', '');
    } else {
      this.removeAttribute('draggable');
    }
  }
}
