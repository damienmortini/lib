import { GestureObserver } from '@damienmortini/gesture-observer';

import css from './index.css' with { type: 'css' };

export default class DamdomViewportElement extends HTMLElement {
  zoom = 1;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [css];
    this.shadowRoot.innerHTML = `
<slot></slot>
<div id="container"></div>`;

    const elementSlotMap = new Map();
    const slotDOMMatrixMap = new Map();
    const container = this.shadowRoot.querySelector('#container');
    const slots = new Set();
    const zoomMatrix = new DOMMatrix();
    const resizingElements = new Set();

    let slotUID = 0;
    let viewportBoundingClientRect = this.getBoundingClientRect();

    const zoom = (scale, x, y) => {
      if (scale === 1) return;
      this.zoom *= scale;

      zoomMatrix.m11 = scale;
      zoomMatrix.m22 = scale;
      zoomMatrix.m41 = -x * (scale - 1);
      zoomMatrix.m42 = -y * (scale - 1);

      for (const slot of slots) {
        const domMatrix = slotDOMMatrixMap.get(slot);
        domMatrix.preMultiplySelf(zoomMatrix);
        slot.style.transform = domMatrix.toString();
      }
    };

    const offsetSlot = (slot, offsetX, offsetY) => {
      const domMatrix = slotDOMMatrixMap.get(slot);
      domMatrix.m41 += offsetX;
      domMatrix.m42 += offsetY;
      slot.style.transform = domMatrix.toString();
    };

    let isViewportInteracting = false;
    new GestureObserver((gesture) => {
      if (gesture.state === 'finishing') {
        isViewportInteracting = false;
        return;
      }
      for (const pointer of gesture.pointers.values()) {
        isViewportInteracting = isViewportInteracting || pointer.target === this;
      }
      if (!isViewportInteracting) return;
      if (gesture.state === 'starting') viewportBoundingClientRect = this.getBoundingClientRect();
      zoom(
        gesture.movementScale,
        gesture.x - viewportBoundingClientRect.x - viewportBoundingClientRect.width * 0.5,
        gesture.y - viewportBoundingClientRect.y - viewportBoundingClientRect.height * 0.5,
      );
      for (const slot of slots) {
        offsetSlot(slot, gesture.movementX, gesture.movementY);
      }
    }).observe(this);

    const elementGestureObserver = new GestureObserver((gesture) => {
      if (gesture.state === 'finishing') resizingElements.delete(gesture.target);
      if (resizingElements.has(gesture.target)) return;
      if (gesture.pointers.size > 1) isViewportInteracting = true;
      if (isViewportInteracting) return;
      const target = gesture.event.target;
      if (
        target.isContentEditable
        || (target instanceof HTMLInputElement
        && ['text', 'number', 'password', 'search', 'number', 'range', 'email', 'url', 'tel'].includes(target.type))
        || target instanceof HTMLTextAreaElement
        || getComputedStyle(target)['touch-action'] === 'none'
      )
        return;
      offsetSlot(gesture.target.assignedSlot, gesture.movementX, gesture.movementY);
    });

    this.addEventListener(
      'wheel',
      (event) => {
        if ((event.target !== this && event.target.scrollHeight > event.target.clientHeight) || !event.deltaY) return;
        viewportBoundingClientRect = this.getBoundingClientRect();
        let scale = 1;
        if (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL) scale -= event.deltaY * 0.001;
        else scale += (event.deltaY < 0 ? 1 : -1) * 0.1;
        const x = event.clientX - viewportBoundingClientRect.x - viewportBoundingClientRect.width * 0.5;
        const y = event.clientY - viewportBoundingClientRect.y - viewportBoundingClientRect.height * 0.5;
        zoom(scale, x, y);
      },
      { passive: false },
    );

    const initializingElements = new Set();
    const resizeObserver = new ResizeObserver((entries) => {
      const node = entries[0].target;
      if (!initializingElements.has(node)) resizingElements.add(node);
      else initializingElements.delete(node);
    });

    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          const slot = document.createElement('slot');
          slot.name = `viewport-slot-${slotUID}`;
          node.slot = slot.name;

          const domMatrix = new DOMMatrix();
          slotDOMMatrixMap.set(slot, domMatrix);
          domMatrix.m11 = this.zoom;
          domMatrix.m22 = this.zoom;

          elementSlotMap.set(node, slot);
          container.appendChild(slot);
          slotUID++;
          slots.add(slot);
          elementGestureObserver.observe(node, { pointerCapture: true });
          initializingElements.add(node);
          resizeObserver.observe(node);
        }
        for (const node of mutation.removedNodes) {
          const slot = elementSlotMap.get(node);
          elementSlotMap.delete(node);
          if (!slot) continue;
          node.slot = '';
          elementGestureObserver.unobserve(node);
          resizeObserver.unobserve(node);
          slots.delete(slot);
          slot.remove();
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
}

customElements.define('damdom-viewport', DamdomViewportElement);
