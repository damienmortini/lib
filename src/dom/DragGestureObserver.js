export default class DragGestureObserver {
  constructor(callback) {
    this._callback = callback;
    this._elementDataMap = new Map();

    this._onPointerDownBinded = this._onPointerDown.bind(this);
    this._onPointerMoveBinded = this._onPointerMove.bind(this);
    this._onPointerUpBinded = this._onPointerUp.bind(this);
    this._updateBinded = this._update.bind(this);
  }

  observe(element) {
    element.addEventListener('pointerdown', this._onPointerDownBinded, { passive: false });
  }

  unobserve(element) {
    this._elementDataMap.delete(element);
    element.removeEventListener('pointerdown', this._onPointerDownBinded, { passive: false });
  }

  disconnect() {
    for (const element of this._elementDataMap.keys()) {
      this.unobserve(element);
    }
  }

  _onPointerDown(event) {
    if (event.currentTarget !== window && !this._elementDataMap.has(event.currentTarget)) {
      this._elementDataMap.set(event.currentTarget, {
        pointerMap: new Map(),
        previousClientX: 0,
        previousClientY: 0,
      });
    }
    window.addEventListener('pointerdown', this._onPointerDownBinded, { passive: false });
    window.addEventListener('pointerup', this._onPointerUpBinded, { passive: false });
    window.addEventListener('pointermove', this._onPointerMoveBinded, { passive: false });
    for (const data of this._elementDataMap.values()) {
      data.pointerMap.set(event.pointerId, event);
      data.previousClientX = 0;
      data.previousClientY = 0;
      cancelAnimationFrame(this._animationFrameID);
      this._update();
    }
  }

  _onPointerMove(event) {
    for (const data of this._elementDataMap.values()) {
      data.pointerMap.set(event.pointerId, event);
    }
  }

  _onPointerUp(event) {
    for (const [element, data] of this._elementDataMap) {
      data.pointerMap.delete(event.pointerId);
      data.previousClientX = 0;
      data.previousClientY = 0;
      if (!data.pointerMap.size) {
        this._elementDataMap.delete(element);
      }
    }
    if (!this._elementDataMap.size) {
      cancelAnimationFrame(this._animationFrameID);
      window.removeEventListener('pointerdown', this._onPointerDownBinded);
      window.removeEventListener('pointermove', this._onPointerMoveBinded);
      window.removeEventListener('pointerup', this._onPointerUpBinded);
    }
  }

  _update() {
    this._animationFrameID = requestAnimationFrame(this._updateBinded);

    for (const [element, data] of this._elementDataMap) {
      let clientX = 0;
      let clientY = 0;
      for (const pointer of data.pointerMap.values()) {
        clientX += pointer.clientX;
        clientY += pointer.clientY;
      }
      clientX /= data.pointerMap.size;
      clientY /= data.pointerMap.size;

      if (data.previousClientX || data.previousClientY) {
        this._callback({
          target: element,
          translateX: clientX - data.previousClientX,
          translateY: clientY - data.previousClientY,
        });
      }

      data.previousClientX = clientX;
      data.previousClientY = clientY;
    }
  }
}
