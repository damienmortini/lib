import Vector2 from '../../../lib/src/math/Vector2.js';

export default class ViewportElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          overflow: hidden;
          touch-action: none;
        }

        div {
          position: absolute;
          touch-action: none;
          left: 50%;
          top: 50%;
        }

        slot {
          position: absolute;
          display: block;
          transform-origin: top left;
          will-change: transform;
          box-sizing: border-box;
        }

        #content slot:focus-within {
          z-index: 1;
        }

        #content slot[disabled]::slotted(*), #content[disabled] slot::slotted(*) {
          pointer-events: none;
        }

        #content slot::slotted(*) {
          transform: none !important;
          top: 0 !important;
          left: 0 !important;
          user-select: none;
          box-sizing: border-box;
        }

        #content slot:hover {
          outline: 1px dotted;
        }

        #content slot[selected] {
          outline: 1px solid;
        }
      </style>
      <slot></slot>
      <div id="content"></div>
    `;

    const slotElementMap = new Map();
    const elementSlotMap = new Map();
    this._slotDOMMatrixMap = new Map();

    const content = this.shadowRoot.querySelector('#content');
    this._styleSheet = this.shadowRoot.querySelector('style').sheet;
    this._slotUID = 0;
    this._slots = new Set();
    this._selectedElements = new class extends Set {
      add(value) {
        elementSlotMap.get(value).setAttribute('selected', '');
        return super.add(value);
      }

      delete(value) {
        elementSlotMap.get(value).removeAttribute('selected');
        return super.delete(value);
      }

      clear() {
        for (const value of this) {
          this.delete(value);
        }
      }
    };

    this.preventManipulation = function (event) {
      return false;
    };

    // Drag/Zoom

    const pointerEventMap = new Map();
    const pointerTargetMap = new Map();
    const targetPointersMap = new Map();

    let actioned = false;
    let previousPinchSize = 0;

    let firstClientX = 0;
    let firstClientY = 0;

    const pinchVector = new Vector2();

    let viewportBoundingClientRect = this.getBoundingClientRect();

    const zoomMatrix = new DOMMatrix();
    const zoom = (scale, x, y) => {
      zoomMatrix.m11 = scale;
      zoomMatrix.m22 = scale;
      zoomMatrix.m41 = -x * (scale - 1);
      zoomMatrix.m42 = -y * (scale - 1);

      for (const slot of this._slots) {
        const domMatrix = this._slotDOMMatrixMap.get(slot);
        domMatrix.preMultiplySelf(zoomMatrix);
        slot.style.transform = domMatrix.toString();
      }
    };

    const resetPositions = () => {
      viewportBoundingClientRect = this.getBoundingClientRect();
      previousPinchSize = 0;
      firstClientX = 0;
      firstClientY = 0;
    };

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Shift') {
        content.setAttribute('disabled', '');
      }
    });

    window.addEventListener('keyup', (event) => {
      if (event.key === 'Shift') {
        content.removeAttribute('disabled');
      }
    });

    const onPointerDown = (event) => {
      if (pointerEventMap.has(event.pointerId)) {
        return;
      }

      if (event.target !== event.currentTarget && event.target.scrollHeight > event.target.offsetHeight) {
        return;
      }

      if (this.preventManipulation(event)) {
        return;
      }

      resetPositions();

      if (!pointerEventMap.size) {
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointerout', onPointerUp);
      }
      pointerEventMap.set(event.pointerId, event);
      pointerTargetMap.set(event.pointerId, event.currentTarget);
      let targetPointersSet = targetPointersMap.get(event.currentTarget);
      if (!targetPointersSet) {
        targetPointersSet = new Set();
        targetPointersMap.set(event.currentTarget, targetPointersSet);
      }
      targetPointersSet.add(event.pointerId);

      const currentElement = slotElementMap.get(event.currentTarget);
      if (!event.shiftKey && event.currentTarget !== this && !this._selectedElements.has(currentElement)) {
        this._selectedElements.clear();
      }
    };

    const onPointerMove = (event) => {
      if (!pointerEventMap.has(event.pointerId)) {
        return;
      }

      actioned = true;

      pointerEventMap.set(event.pointerId, event);
      const pointerIds = [...pointerEventMap.keys()];

      let isViewport = false;
      for (const target of pointerTargetMap.values()) {
        if (target === this) {
          isViewport = true;
        }
      }

      if (isViewport) {
        let sumMovementX = 0;
        let sumMovementY = 0;
        for (const pointer of pointerEventMap.values()) {
          sumMovementX += pointer.movementX;
          sumMovementY += pointer.movementY;
        }
        sumMovementX /= pointerEventMap.size;
        sumMovementY /= pointerEventMap.size;

        for (const slot of this._slots) {
          this._offsetElement(slot, sumMovementX / window.devicePixelRatio, sumMovementY / window.devicePixelRatio);
        }
      } else if (!isViewport) {
        const slot = pointerTargetMap.get(event.pointerId);
        const targetPointersSet = targetPointersMap.get(slot);
        const element = slotElementMap.get(slot);

        if (!this._selectedElements.has(element)) {
          this._selectedElements.add(element);
        }

        slot.setAttribute('disabled', '');

        let sumMovementX = 0;
        let sumMovementY = 0;
        for (const pointer of targetPointersSet) {
          const pointerEvent = pointerEventMap.get(pointer);
          sumMovementX += pointerEvent.movementX;
          sumMovementY += pointerEvent.movementY;
        }
        sumMovementX /= targetPointersSet.size * targetPointersSet.size;
        sumMovementY /= targetPointersSet.size * targetPointersSet.size;
        sumMovementX /= window.devicePixelRatio;
        sumMovementY /= window.devicePixelRatio;

        if (pointerTargetMap.size > 1) {
          this._offsetElement(slot, sumMovementX, sumMovementY);
        } else {
          for (const element of this._selectedElements) {
            const slot = elementSlotMap.get(element);
            this._offsetElement(slot, sumMovementX, sumMovementY);
          }
        }
        if (targetPointersSet.size === 2) {
          if (slot.style.resize === 'none') {
            isViewport = true;
          } else {
            let otherPointerEvent;

            for (const pointer of targetPointersSet) {
              const pointerEvent = pointerEventMap.get(pointer);
              if (pointerEvent !== event) {
                otherPointerEvent = pointerEvent;
              }
            }

            const pinchOffsetLeft = (event.clientX < otherPointerEvent.clientX ? event.movementX : 0) / window.devicePixelRatio;
            const pinchOffsetRight = (event.clientX > otherPointerEvent.clientX ? event.movementX : 0) / window.devicePixelRatio;
            const pinchOffsetTop = (event.clientY < otherPointerEvent.clientY ? event.movementY : 0) / window.devicePixelRatio;
            const pinchOffsetBottom = (event.clientY > otherPointerEvent.clientY ? event.movementY : 0) / window.devicePixelRatio;

            const boundingClientRect = slot.getBoundingClientRect();
            const domMatrix = this._slotDOMMatrixMap.get(slot);

            if (slot.style.resize === 'both' || slot.style.resize === 'horizontal') {
              slot.style.width = `${(boundingClientRect.width - pinchOffsetLeft + pinchOffsetRight) * (1 / domMatrix.a)}px`;
              domMatrix.m41 += pinchOffsetLeft - sumMovementX;
            }

            if (slot.style.resize === 'both' || slot.style.resize === 'vertical') {
              slot.style.height = `${(boundingClientRect.height - pinchOffsetTop + pinchOffsetBottom) * (1 / domMatrix.d)}px`;
              domMatrix.m42 += pinchOffsetTop - sumMovementY;
            }

            slot.style.transform = domMatrix.toString();
          }
        }
      }

      if (event.pointerId === pointerIds[0]) {
        firstClientX = event.clientX;
        firstClientY = event.clientY;
      }
      if (event.pointerId === pointerIds[1]) {
        if (firstClientX || firstClientY) {
          const x = (firstClientX + event.clientX) * .5 - viewportBoundingClientRect.x - viewportBoundingClientRect.width * .5;
          const y = (firstClientY + event.clientY) * .5 - viewportBoundingClientRect.y - viewportBoundingClientRect.height * .5;
          pinchVector.x = firstClientX - event.clientX;
          pinchVector.y = firstClientY - event.clientY;

          const pinchSize = pinchVector.size;

          if (isViewport && previousPinchSize) {
            zoom(pinchSize / previousPinchSize, x, y);
          }

          previousPinchSize = pinchSize;
        }
      }
    };

    const onPointerUp = (event) => {
      resetPositions();
      event.preventDefault();
      if (event.pointerType === 'mouse' && event.type === 'pointerout' || !pointerEventMap.has(event.pointerId)) {
        return;
      }
      const target = pointerTargetMap.get(event.pointerId);
      const targetPointersSet = targetPointersMap.get(target);
      targetPointersSet.delete(event.pointerId);
      if (!targetPointersSet.size) {
        targetPointersMap.delete(target);
        target.removeAttribute('disabled');
      }
      pointerEventMap.delete(event.pointerId);
      pointerTargetMap.delete(event.pointerId);
      if (!pointerEventMap.size) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointerout', onPointerUp);
        const element = slotElementMap.get(target);
        if (!actioned) {
          if (target === this) {
            this._selectedElements.clear();
          } else {
            if (event.shiftKey && this._selectedElements.has(element)) {
              this._selectedElements.delete(element);
            } else {
              if (!event.shiftKey) {
                this._selectedElements.clear();
              }
              this._selectedElements.add(element);
            }
          }
        }
        actioned = false;
      }
    };

    this.addEventListener('pointerdown', onPointerDown);

    this.addEventListener('wheel', (event) => {
      if (event.target !== this && event.target.scrollHeight > event.target.clientHeight) {
        return;
      }
      const viewportBoundingClientRect = this.getBoundingClientRect();
      const scale = 1 + (event.deltaY < 0 ? 1 : -1) * .1;
      const x = event.clientX - viewportBoundingClientRect.x - viewportBoundingClientRect.width * .5;
      const y = event.clientY - viewportBoundingClientRect.y - viewportBoundingClientRect.height * .5;
      zoom(scale, x, y);
    });

    // Mutation Observer
    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) {
            continue;
          }
          const boundingClientRect = node.getBoundingClientRect();
          const slot = document.createElement('slot');
          slot.name = `viewport-slot-${this._slotUID}`;
          node.slot = slot.name;
          const domMatrix = new DOMMatrix();
          this._slotDOMMatrixMap.set(slot, domMatrix);
          this._offsetElement(slot, boundingClientRect.x, boundingClientRect.y);
          const style = getComputedStyle(node);
          slot.style.resize = style.resize;
          if (style.resize !== 'none') {
            let ruleString = `[name="${slot.name}"]::slotted(*) {`;
            if (/both|horizontal/.test(style.resize)) {
              slot.style.width = `${boundingClientRect.width}px`;
              ruleString += 'width: 100% !important;';
            }
            if (/both|vertical/.test(style.resize)) {
              slot.style.height = `${boundingClientRect.height}px`;
              ruleString += 'height: 100% !important;';
            }
            ruleString += '}';
            this._styleSheet.insertRule(ruleString, this._styleSheet.cssRules.length);
          }
          content.appendChild(slot);
          this._slotUID++;
          this._slots.add(slot);
          slotElementMap.set(slot, node);
          elementSlotMap.set(node, slot);
          slot.addEventListener('pointerdown', onPointerDown);
        }
        for (const node of mutation.removedNodes) {
          if (!(node instanceof HTMLElement)) {
            continue;
          }
          const slot = elementSlotMap.get(node);
          slot.removeEventListener('pointerdown', onPointerDown);
          slotElementMap.delete(slot);
          this._slots.delete(slot);
          slot.remove();
          for (const [index, rule] of [...this._styleSheet.cssRules].entries()) {
            if (rule.selectorText === `[name="${slot.name}"]::slotted(*)`) {
              this._styleSheet.deleteRule(index);
            }
          }
        }
      }
    };
    mutationCallback([{
      addedNodes: this.children,
      removedNodes: [],
    }]);
    const observer = new MutationObserver(mutationCallback);
    observer.observe(this, { childList: true });
  }

  get selectedElements() {
    return this._selectedElements;
  }

  centerView() {
    const domRect = new DOMRect(Infinity, Infinity, 0, 0);
    for (const slot of this._slots) {
      const boundingClientRect = slot.getBoundingClientRect();
      domRect.x = Math.min(domRect.x, boundingClientRect.x);
      domRect.y = Math.min(domRect.y, boundingClientRect.y);
      domRect.width = Math.max(domRect.width, boundingClientRect.x + boundingClientRect.width - domRect.x);
      domRect.height = Math.max(domRect.height, boundingClientRect.y + boundingClientRect.height - domRect.y);
    }

    const viewportBoundingClientRect = this.getBoundingClientRect();
    const offsetX = -domRect.x - domRect.width * .5 + viewportBoundingClientRect.x + viewportBoundingClientRect.width * .5;
    const offsetY = -domRect.y - domRect.height * .5 + viewportBoundingClientRect.y + viewportBoundingClientRect.height * .5;
    for (const slot of this._slots) {
      this._offsetElement(slot, offsetX, offsetY);
    }
  }

  _offsetElement(element, offsetX, offsetY) {
    const domMatrix = this._slotDOMMatrixMap.get(element);
    domMatrix.m41 += offsetX;
    domMatrix.m42 += offsetY;
    element.style.transform = domMatrix.toString();
  }
}
