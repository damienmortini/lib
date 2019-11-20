import Vector2 from '../../../lib/src/math/Vector2.js';

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

        .viewport-slot::slotted(*) {
          transform: none !important;
          top: 0 !important;
          left: 0 !important;
          user-select: none;
        }
      </style>
      <slot></slot>
      <div id="content"></div>
    `;

    const content = this.shadowRoot.querySelector('#content');
    this._styleSheet = this.shadowRoot.querySelector('style').sheet;
    const slots = new Set();
    const slotElementMap = new Map();
    const elementSlotMap = new Map();

    // Behaviour

    const pointers = new Map();
    const pointerTargets = new Map();

    const VECTOR2 = new Vector2();

    const DOM_MATRIX_A = new DOMMatrix();
    const DOM_MATRIX_B = new DOMMatrix();

    let previousPinchSize = 0;

    let firstClientX = 0;
    let firstClientY = 0;

    const zoom = (scale, x, y) => {
      DOM_MATRIX_B.setMatrixValue('');
      DOM_MATRIX_B.scaleSelf(scale);
      DOM_MATRIX_B.m41 = -x * (scale - 1);
      DOM_MATRIX_B.m42 = -y * (scale - 1);

      for (const slot of slots) {
        DOM_MATRIX_A.setMatrixValue(slot.style.transform);
        DOM_MATRIX_A.preMultiplySelf(DOM_MATRIX_B);
        slot.style.transformOrigin = 'top left';
        slot.style.transform = DOM_MATRIX_A.toString();
      }
    };

    const move = (element, movementX, movementY) => {
      DOM_MATRIX_A.setMatrixValue(element.style.transform);
      DOM_MATRIX_A.m41 += movementX;
      DOM_MATRIX_A.m42 += movementY;
      element.style.transform = DOM_MATRIX_A.toString();
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
      if (pointers.has(event.pointerId)) {
        return;
      }
      if (this.preventManipulation(event)) {
        return;
      }

      if (!pointers.size) {
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointerout', onPointerUp);
      }
      pointers.set(event.pointerId, event);
      pointerTargets.set(event.pointerId, event.currentTarget);
    };

    const onPointerMove = (event) => {
      if (!pointers.has(event.pointerId)) {
        return;
      }

      pointers.set(event.pointerId, event);
      const pointerIds = [...pointers.keys()];

      let isViewport = false;
      for (const target of pointerTargets.values()) {
        if (target === this) {
          isViewport = true;
        }
      }

      if (isViewport) {
        let sumMovementX = 0;
        let sumMovementY = 0;
        for (const pointer of pointers.values()) {
          sumMovementX += pointer.movementX;
          sumMovementY += pointer.movementY;
        }
        sumMovementX /= pointers.size;
        sumMovementY /= pointers.size;

        for (const slot of slots) {
          move(slot, sumMovementX / window.devicePixelRatio, sumMovementY / window.devicePixelRatio);
        }
      } else if (!isViewport) {
        const slot = pointerTargets.get(event.pointerId);
        const elementPointers = [];
        for (const [key, target] of pointerTargets) {
          if (target === slot) {
            elementPointers.push(pointers.get(key));
          }
        }

        let sumMovementX = 0;
        let sumMovementY = 0;
        for (const pointer of elementPointers) {
          sumMovementX += pointer.movementX;
          sumMovementY += pointer.movementY;
        }
        sumMovementX /= elementPointers.length * elementPointers.length;
        sumMovementY /= elementPointers.length * elementPointers.length;
        sumMovementX /= window.devicePixelRatio;
        sumMovementY /= window.devicePixelRatio;

        if (elementPointers.length === 1) {
          move(slot, sumMovementX, sumMovementY);
        } else if (elementPointers.length === 2) {
          const element = slotElementMap.get(slot);
          const styles = getComputedStyle(element);

          if (styles.resize === 'none') {
            isViewport = true;
          } else {
            const boundingClientRect = element.getBoundingClientRect();

            DOM_MATRIX_A.setMatrixValue(slot.style.transform);

            const otherPointer = elementPointers[0] === event ? elementPointers[1] : elementPointers[0];

            const pinchOffsetLeft = (event.clientX < otherPointer.clientX ? event.movementX : 0) / window.devicePixelRatio;
            const pinchOffsetRight = (event.clientX > otherPointer.clientX ? event.movementX : 0) / window.devicePixelRatio;
            const pinchOffsetTop = (event.clientY < otherPointer.clientY ? event.movementY : 0) / window.devicePixelRatio;
            const pinchOffsetBottom = (event.clientY > otherPointer.clientY ? event.movementY : 0) / window.devicePixelRatio;

            console.log(pinchOffsetLeft);


            if (styles.resize === 'both' || styles.resize === 'horizontal') {
              if (element.scrollWidth <= element.offsetWidth) {
                element.style.width = `${boundingClientRect.width - pinchOffsetLeft}px`;
                DOM_MATRIX_A.m41 += pinchOffsetLeft;
              }
              //  else {
              //   element.style.width = `${element.scrollWidth}px`;
              // }
            } else if (Math.abs(pinchOffsetLeft) + Math.abs(pinchOffsetRight) > Math.abs(pinchOffsetTop) + Math.abs(pinchOffsetBottom)) {
              // isViewport = true;
            }

            // if (styles.resize === 'both' || styles.resize === 'vertical') {
            //   if (element.scrollHeight <= element.offsetHeight) {
            //     element.style.height = `${boundingClientRect.height * (1 / DOM_MATRIX_A.d) - pinchOffsetTop + pinchOffsetBottom}px`;
            //     DOM_MATRIX_A.m42 += pinchOffsetTop * DOM_MATRIX_A.d;
            //   } else {
            //     element.style.height = `${element.scrollHeight}px`;
            //   }
            // } else if (Math.abs(pinchOffsetLeft) + Math.abs(pinchOffsetRight) < Math.abs(pinchOffsetTop) + Math.abs(pinchOffsetBottom)) {
            //   isViewport = true;
            // }

            // element.style.transformOrigin = 'top left';
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
      if (event.pointerType === 'mouse' && event.type === 'pointerout' || !pointers.has(event.pointerId)) {
        return;
      }
      pointers.delete(event.pointerId);
      pointerTargets.delete(event.pointerId);
      if (!pointers.size) {
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
          const boundingClientRect = node.getBoundingClientRect();
          const slot = document.createElement('slot');
          slot.name = `viewport-slot-${this._slotUID}`;
          slot.classList.add('viewport-slot');
          node.slot = slot.name;
          slot.style.transform = `translate(${boundingClientRect.x}px, ${boundingClientRect.y}px)`;
          slot.style.width = `${boundingClientRect.width}px`;
          slot.style.height = `${boundingClientRect.height}px`;
          const style = getComputedStyle(node);
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
          slots.add(slot);
          slotElementMap.set(slot, node);
          elementSlotMap.set(node, slot);
          slot.addEventListener('pointerdown', onPointerDown);
          resizeObserver.observe(node);
        }
        for (const node of mutation.removedNodes) {
          resizeObserver.unobserve(node);
          const slot = elementSlotMap.get(node);
          slot.removeEventListener('pointerdown', onPointerDown);
          slotElementMap.delete(slot);
          slots.delete(slot);
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

    // Center nodes
    const domRect = new DOMRect(Infinity, Infinity, 0, 0);
    for (const slot of slots) {
      const boundingClientRect = slot.getBoundingClientRect();
      domRect.x = Math.min(domRect.x, boundingClientRect.x);
      domRect.y = Math.min(domRect.y, boundingClientRect.y);
      domRect.width = Math.max(domRect.width, boundingClientRect.x + boundingClientRect.width - domRect.x);
      domRect.height = Math.max(domRect.height, boundingClientRect.y + boundingClientRect.height - domRect.y);
    }

    const offsetX = -domRect.x - domRect.width * .5 + this.clientWidth * .5;
    const offsetY = -domRect.y - domRect.height * .5 + this.clientHeight * .5;
    for (const slot of slots) {
      move(slot, offsetX, offsetY);
    }
  }
}
