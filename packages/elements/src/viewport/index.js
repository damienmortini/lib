import Vector2 from '../../../lib/src/math/Vector2.js';

export default class ViewportElement extends HTMLElement {
  constructor() {
    super();

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
          left: 50%;
          top: 50%;
        }

        ::slotted(*) {
          box-sizing: border-box;
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

      for (const element of slottedElements) {
        DOM_MATRIX_A.setMatrixValue(element.style.transform);
        DOM_MATRIX_A.preMultiplySelf(DOM_MATRIX_B);
        element.style.transformOrigin = 'top left';
        element.style.transform = DOM_MATRIX_A.toString();
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

      if (pointers.has(event.pointerId)) {
        return;
      }
      if (this.preventManipulation(event)) {
        return;
      }

      if (!pointers.size) {
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { passive: true });
        window.addEventListener('pointerout', onPointerUp, { passive: true });
      }
      pointers.set(event.pointerId, event);
      pointerTargets.set(event.pointerId, event.currentTarget);
    };

    const onPointerMove = (event) => {
      if (!event.pressure || !pointers.has(event.pointerId)) {
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

      if (isViewport && pointers.size) {
        let sumMovementX = 0;
        let sumMovementY = 0;
        for (const pointer of pointers.values()) {
          if (!pointer.pressure) {
            continue;
          }
          sumMovementX += pointer.movementX;
          sumMovementY += pointer.movementY;
        }
        sumMovementX /= pointers.size;
        sumMovementY /= pointers.size;

        for (const element of slottedElements) {
          move(element, sumMovementX / window.devicePixelRatio, sumMovementY / window.devicePixelRatio);
        }
      } else if (!isViewport) {
        const element = pointerTargets.get(event.pointerId);
        const elementPointers = [];
        for (const [key, target] of pointerTargets) {
          if (target === element) {
            elementPointers.push(pointers.get(key));
          }
        }

        if (elementPointers.length === 1) {
          move(element, event.movementX / window.devicePixelRatio, event.movementY / window.devicePixelRatio);
        } else if (elementPointers.length === 2) {
          const element = pointerTargets.get(event.pointerId);
          const boundingClientRect = element.getBoundingClientRect();

          DOM_MATRIX_A.setMatrixValue(element.style.transform);

          const otherPointer = elementPointers[0] === event ? elementPointers[1] : elementPointers[0];

          const pinchOffsetLeft = (event.clientX < otherPointer.clientX ? event.movementX : 0) / window.devicePixelRatio * (1 / DOM_MATRIX_A.a);
          const pinchOffsetRight = (event.clientX > otherPointer.clientX ? event.movementX : 0) / window.devicePixelRatio * (1 / DOM_MATRIX_A.a);
          const pinchOffsetTop = (event.clientY < otherPointer.clientY ? event.movementY : 0) / window.devicePixelRatio * (1 / DOM_MATRIX_A.d);
          const pinchOffsetBottom = (event.clientY > otherPointer.clientY ? event.movementY : 0) / window.devicePixelRatio * (1 / DOM_MATRIX_A.d);

          element.style.width = `${boundingClientRect.width * (1 / DOM_MATRIX_A.a) - pinchOffsetLeft + pinchOffsetRight}px`;
          element.style.height = `${boundingClientRect.height * (1 / DOM_MATRIX_A.d) - pinchOffsetTop + pinchOffsetBottom}px`;
          DOM_MATRIX_A.m41 += pinchOffsetLeft * DOM_MATRIX_A.a;
          DOM_MATRIX_A.m42 += pinchOffsetTop * DOM_MATRIX_A.d;
          element.style.transformOrigin = 'top left';
          element.style.transform = DOM_MATRIX_A.toString();
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

    this.addEventListener('pointerdown', onPointerDown, { passive: true });

    this.addEventListener('wheel', (event) => {
      const scale = 1 + (event.deltaY < 0 ? 1 : -1) * .1;
      const x = event.clientX - this.clientWidth * .5;
      const y = event.clientY - this.clientHeight * .5;
      zoom(scale, x, y);
    }, { passive: true });

    // Nodes

    // Add/remove elements functions
    const addElement = (element) => {
      slottedElements.add(element);
      element.addEventListener('pointerdown', onPointerDown, { passive: true });
    };

    const removeElement = (element) => {
      element.removeEventListener('pointerdown', onPointerDown);
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

    // Center nodes
    const domRect = new DOMRect(Infinity, Infinity, 0, 0);
    for (const element of slottedElements) {
      const boundingClientRect = element.getBoundingClientRect();
      domRect.x = Math.min(domRect.x, boundingClientRect.x);
      domRect.y = Math.min(domRect.y, boundingClientRect.y);
      domRect.width = Math.max(domRect.width, boundingClientRect.x + boundingClientRect.width - domRect.x);
      domRect.height = Math.max(domRect.height, boundingClientRect.y + boundingClientRect.height - domRect.y);
    }

    const offsetX = -domRect.x - domRect.width * .5 + this.clientWidth * .5;
    const offsetY = -domRect.y - domRect.height * .5 + this.clientHeight * .5;
    for (const element of slottedElements) {
      const domMatrix = new DOMMatrix(element.style.transform);
      domMatrix.translateSelf(offsetX, offsetY);
      element.style.transform = domMatrix.toString();
    }
  }
}
