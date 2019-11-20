import Vector2 from '../../../lib/src/math/Vector2.js';

const VECTOR2 = new Vector2();

const DOM_MATRIX_A = new DOMMatrix();
const DOM_MATRIX_B = new DOMMatrix();

export default class ViewportElement extends HTMLElement {
  constructor() {
    super();

    this._slotUID = 0;

    this.preventManipulation = function (event) {
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
          touch-action: none;
          left: 50%;
          top: 50%;
        }

        slot {
          position: absolute;
          display: block;
          will-change: transform;
        }

        .viewport-slot:focus-within {
          z-index: 1;
        }

        .viewport-slot::slotted(*) {
          transform: none !important;
          top: 0 !important;
          left: 0 !important;
          user-select: none;
        }

        .disable-children::slotted(*) {
          pointer-events: none;
        }
      </style>
      <slot></slot>
      <div id="content"></div>
    `;

    const content = this.shadowRoot.querySelector('#content');
    this._styleSheet = this.shadowRoot.querySelector('style').sheet;
    this._slots = new Set();
    const slotElementMap = new Map();
    const elementSlotMap = new Map();

    // Behaviour

    const pointerEventMap = new Map();
    const pointerTargetMap = new Map();
    const targetPointersMap = new Map();

    let previousPinchSize = 0;

    let firstClientX = 0;
    let firstClientY = 0;

    const zoom = (scale, x, y) => {
      DOM_MATRIX_B.setMatrixValue('');
      DOM_MATRIX_B.scaleSelf(scale);
      DOM_MATRIX_B.m41 = -x * (scale - 1);
      DOM_MATRIX_B.m42 = -y * (scale - 1);

      for (const slot of this._slots) {
        DOM_MATRIX_A.setMatrixValue(slot.style.transform);
        DOM_MATRIX_A.preMultiplySelf(DOM_MATRIX_B);
        slot.style.transformOrigin = 'top left';
        slot.style.transform = DOM_MATRIX_A.toString();
      }
    };

    const reset = () => {
      previousPinchSize = 0;
      firstClientX = 0;
      firstClientY = 0;
    };

    const onPointerDown = (event) => {
      reset();

      if (event.target !== event.currentTarget && event.target.scrollHeight > event.target.offsetHeight) {
        return;
      }
      if (pointerEventMap.has(event.pointerId)) {
        return;
      }
      if (this.preventManipulation(event)) {
        return;
      }

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
        event.currentTarget.classList.add('disable-children');
      }
      targetPointersSet.add(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!pointerEventMap.has(event.pointerId)) {
        return;
      }

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

        this._offsetElement(slot, sumMovementX, sumMovementY);
        if (targetPointersSet.size === 2) {
          if (slot.style.resize === 'none') {
            isViewport = true;
          } else {
            const boundingClientRect = slot.getBoundingClientRect();

            DOM_MATRIX_A.setMatrixValue(slot.style.transform);

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

            if (slot.style.resize === 'both' || slot.style.resize === 'horizontal') {
              slot.style.width = `${(boundingClientRect.width - pinchOffsetLeft + pinchOffsetRight) * (1 / DOM_MATRIX_A.a)}px`;
              DOM_MATRIX_A.m41 += pinchOffsetLeft - sumMovementX;
            }

            if (slot.style.resize === 'both' || slot.style.resize === 'vertical') {
              slot.style.height = `${(boundingClientRect.height - pinchOffsetTop + pinchOffsetBottom) * (1 / DOM_MATRIX_A.d)}px`;
              DOM_MATRIX_A.m42 += pinchOffsetTop - sumMovementY;
            }

            slot.style.transform = DOM_MATRIX_A.toString();
          }
        }
      }

      if (event.pointerId === pointerIds[0]) {
        firstClientX = event.clientX;
        firstClientY = event.clientY;
      }
      if (event.pointerId === pointerIds[1]) {
        if (firstClientX || firstClientY) {
          const x = (firstClientX + event.clientX) * .5 - this.clientWidth * .5;
          const y = (firstClientY + event.clientY) * .5 - this.clientHeight * .5;
          VECTOR2.x = firstClientX - event.clientX;
          VECTOR2.y = firstClientY - event.clientY;

          const pinchSize = VECTOR2.size;

          if (isViewport && previousPinchSize) {
            zoom(pinchSize / previousPinchSize, x, y);
          }

          previousPinchSize = pinchSize;
        }
      }
    };

    const onPointerUp = (event) => {
      reset();
      event.preventDefault();
      if (event.pointerType === 'mouse' && event.type === 'pointerout' || !pointerEventMap.has(event.pointerId)) {
        return;
      }
      const target = pointerTargetMap.get(event.pointerId);
      const targetPointersSet = targetPointersMap.get(target);
      targetPointersSet.delete(event.pointerId);
      if (!targetPointersSet.size) {
        targetPointersMap.delete(target);
        target.classList.remove('disable-children');
      }
      pointerEventMap.delete(event.pointerId);
      pointerTargetMap.delete(event.pointerId);
      if (!pointerEventMap.size) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointerout', onPointerUp);
      }
    };

    this.addEventListener('pointerdown', onPointerDown);

    this.addEventListener('wheel', (event) => {
      if (event.target.scrollHeight > event.target.clientHeight) {
        return;
      }
      const scale = 1 + (event.deltaY < 0 ? 1 : -1) * .1;
      const x = event.clientX - this.clientWidth * .5;
      const y = event.clientY - this.clientHeight * .5;
      zoom(scale, x, y);
    });

    // Mutation Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const boundingClientRect = entry.target.assignedSlot.getBoundingClientRect();
        if (Math.abs(boundingClientRect.width - entry.contentRect.width) < 1 &&
          Math.abs(boundingClientRect.height - entry.contentRect.height) < 1) {
          continue;
        }
        entry.target.assignedSlot.style.width = `${entry.contentRect.width}px`;
        entry.target.assignedSlot.style.height = `${entry.contentRect.height}px`;
      }
    });
    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) {
            continue;
          }
          const boundingClientRect = node.getBoundingClientRect();
          const slot = document.createElement('slot');
          slot.name = `viewport-slot-${this._slotUID}`;
          slot.classList.add('viewport-slot');
          node.slot = slot.name;
          slot.style.transform = `translate(${boundingClientRect.x}px, ${boundingClientRect.y}px)`;
          slot.style.width = `${boundingClientRect.width}px`;
          slot.style.height = `${boundingClientRect.height}px`;
          const style = getComputedStyle(node);
          slot.style.resize = style.resize;
          if (style.resize !== 'none') {
            let ruleString = `[name="${slot.name}"]::slotted(*) {`;
            if (/both|horizontal/.test(style.resize)) {
              ruleString += 'width: 100% !important;';
            }
            if (/both|vertical/.test(style.resize)) {
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
          resizeObserver.observe(node);
        }
        for (const node of mutation.removedNodes) {
          if (!(node instanceof HTMLElement)) {
            continue;
          }
          resizeObserver.unobserve(node);
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

  centerView() {
    const domRect = new DOMRect(Infinity, Infinity, 0, 0);
    for (const slot of this._slots) {
      const boundingClientRect = slot.getBoundingClientRect();
      domRect.x = Math.min(domRect.x, boundingClientRect.x);
      domRect.y = Math.min(domRect.y, boundingClientRect.y);
      domRect.width = Math.max(domRect.width, boundingClientRect.x + boundingClientRect.width - domRect.x);
      domRect.height = Math.max(domRect.height, boundingClientRect.y + boundingClientRect.height - domRect.y);
    }

    const offsetX = -domRect.x - domRect.width * .5 + this.clientWidth * .5;
    const offsetY = -domRect.y - domRect.height * .5 + this.clientHeight * .5;
    for (const slot of this._slots) {
      this._offsetElement(slot, offsetX, offsetY);
    }
  }

  _offsetElement(element, offsetX, offsetY) {
    DOM_MATRIX_A.setMatrixValue(element.style.transform);
    DOM_MATRIX_A.m41 += offsetX;
    DOM_MATRIX_A.m42 += offsetY;
    element.style.transform = DOM_MATRIX_A.toString();
  }
}
