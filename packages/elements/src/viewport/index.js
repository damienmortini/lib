import Vector2 from "../../../lib/src/math/Vector2.js";

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
      <div id="container">
        <slot></slot>
      </div>
    `;

    const container = this.shadowRoot.querySelector('#container');
    const slot = this.shadowRoot.querySelector('slot');
    const slottedElements = new Set(slot.assignedElements({ flatten: true }));

    // Drag
    // const dragGestureObserver = new DragGestureObserver((data) => {
    //   let elements;
    //   if (data.target === this) {
    //     elements = slottedElements;
    //   } else if (slottedElements.has(data.target)) {
    //     elements = [data.target];
    //   }
    //   if (!elements) {
    //     return;
    //   }
    //   for (const element of elements) {
    //     const domMatrix = new DOMMatrix(element.style.transform);
    //     domMatrix.m41 += data.translateX;
    //     domMatrix.m42 += data.translateY;
    //     element.style.transform = domMatrix.toString();
    //   }
    // });
    // dragGestureObserver.observe(this);

    const pointers = new Map();
    let previousSize = 0;

    this.addEventListener('pointerdown', (event) => {
      previousSize = 0;
      pointers.set(event.pointerId, event);
    });
    const zoom = (scale, x, y) => {
      const scaleDOMMatrix = new DOMMatrix();
      scaleDOMMatrix.scale3dSelf(scale);
      scaleDOMMatrix.m41 = -x * (scale - 1);
      scaleDOMMatrix.m42 = -y * (scale - 1);

      for (const element of slottedElements) {
        const domMatrix = new DOMMatrix(element.style.transform);
        domMatrix.preMultiplySelf(scaleDOMMatrix);
        element.style.transformOrigin = 'top left';
        element.style.transform = domMatrix.toString();
      }
    }
    const vector2 = new Vector2();
    let firstClientX = 0;
    let firstClientY = 0;
    window.addEventListener('pointermove', (event) => {
      pointers.set(event.pointerId, event);
      const pointerIds = [...pointers.keys()];

      if (pointers.size) {
        let sumMovementX = 0;
        let sumMovementY = 0;
        for (const pointer of pointers.values()) {
          sumMovementX += pointer.movementX;
          sumMovementY += pointer.movementY;
        }
        sumMovementX /= pointers.size;
        sumMovementY /= pointers.size;

        for (const element of slottedElements) {
          const domMatrix = new DOMMatrix(element.style.transform);
          domMatrix.m41 += sumMovementX / window.devicePixelRatio;
          domMatrix.m42 += sumMovementY / window.devicePixelRatio;
          element.style.transform = domMatrix.toString();
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
          vector2.x = firstClientX - event.clientX;
          vector2.y = firstClientY - event.clientY;

          const size = vector2.size;

          if (previousSize) {
            const scale = size / previousSize;
            zoom(scale, x, y);
          }

          previousSize = size;
        }
      }
    });
    window.addEventListener('pointerup', (event) => {
      pointers.delete(event.pointerId);
    });

    this.addEventListener('wheel', (event) => {
      const scale = 1 + (event.deltaY < 0 ? 1 : -1) * .1;
      const x = event.clientX - this.clientWidth * .5;
      const y = event.clientY - this.clientHeight * .5;
      zoom(scale, x, y);
    });

    // Add/remove elements functions
    const addElement = (element) => {
      slottedElements.add(element);
      // dragGestureObserver.observe(element);
      // element.addEventListener('pointerdown', startDrag, { passive: false });
    };

    const removeElement = (element) => {
      slottedElements.delete(element);
      // dragGestureObserver.unobserve(element);
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
