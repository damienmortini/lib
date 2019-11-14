import Vector2 from '../math/Vector2.js';

const VECTOR2 = new Vector2();

export default class PinchGestureObserver {
  constructor(callback) {
    this._callback = callback;
    this._elementsData = new Map();

    this._onPointerDownBinded = this._onPointerDown.bind(this);
    this._onPointerMoveBinded = this._onPointerMove.bind(this);
    this._onPointerUpBinded = this._onPointerUp.bind(this);
    this._updateBinded = this._update.bind(this);
  }

  observe(element) {
    element.addEventListener('pointerdown', this._onPointerDownBinded, { passive: false });
  }

  unobserve(element) {
    this._elementsData.delete(element);
    element.removeEventListener('pointerdown', this._onPointerDownBinded, { passive: false });
  }

  disconnect() {
    for (const element of this._elementsData.keys()) {
      this.unobserve(element);
    }
  }

  _onPointerDown(event) {
    if (event.currentTarget !== window && !this._elementsData.has(event.currentTarget)) {
      this._elementsData.set(event.currentTarget, {
        previousSize: 0,
        pointerMap: new Map(),
      });
      window.addEventListener('pointerdown', this._onPointerDownBinded, { passive: false });
      window.addEventListener('pointerup', this._onPointerUpBinded, { passive: false });
    }
    for (const data of this._elementsData.values()) {
      if (data.pointerMap.size === 2) {
        return;
      }
      data.pointerMap.set(event.pointerId, event);
      data.previousSize = 0;
      if (data.pointerMap.size === 2) {
        window.addEventListener('pointermove', this._onPointerMoveBinded, { passive: false });
        cancelAnimationFrame(this._animationFrameID);
        this._update();
      }
    }
  }

  _onPointerMove(event) {
    for (const data of this._elementsData.values()) {
      if (data.pointerMap.has(event.pointerId)) {
        data.pointerMap.set(event.pointerId, event);
      }
    }
  }

  _onPointerUp(event) {
    for (const [element, data] of this._elementsData) {
      data.pointerMap.delete(event.pointerId);
      data.previousSize = 0;
      if (!data.pointerMap.size) {
        this._elementsData.delete(element);
      }
    }
    if (!this._elementsData.size) {
      cancelAnimationFrame(this._animationFrameID);
      window.removeEventListener('pointerdown', this._onPointerDownBinded);
      window.removeEventListener('pointermove', this._onPointerMoveBinded);
      window.removeEventListener('pointerup', this._onPointerUpBinded);
    }
  }

  _update() {
    this._animationFrameID = requestAnimationFrame(this._updateBinded);

    for (const [element, data] of this._elementsData) {
      if (data.pointerMap.size < 2) {
        continue;
      }

      VECTOR2.x = 0;
      VECTOR2.y = 0;
      let clientX = 0;
      let clientY = 0;
      let index = 0;

      for (const pointer of data.pointerMap.values()) {
        VECTOR2.x += pointer.clientX * (index ? -1 : 1);
        VECTOR2.y += pointer.clientY * (index ? -1 : 1);
        clientX += pointer.clientX;
        clientY += pointer.clientY;
        index++;
      }
      clientX /= data.pointerMap.size;
      clientY /= data.pointerMap.size;

      const size = VECTOR2.size;
      if (data.previousSize) {
        this._callback({
          target: element,
          clientX,
          clientY,
          scale: size / data.previousSize,
        });
      }
      data.previousSize = size;
    }
  }
}
