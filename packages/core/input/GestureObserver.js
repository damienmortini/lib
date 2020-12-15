import Vector2 from '../math/Vector2.js';

class GestureObserver {
  /**
   * @typedef Gesture
   * @property {HTMLElement} target - The target DOM Element
   * @property {number} movementX - Movement on the X axis
   * @property {number} movementY - Movement on the Y axis
   * @property {number} movementScale - Pinch-zoom movement
   * @property {number} movementRotation - Angular movement in radians
   * @property {boolean} isSwipe - Is the gesture a swipe
   */
  /**
   * @callback GestureObserverCallback
   * @param {Gesture} gesture - Current gesture changes
   */
  /**
   * @param {GestureObserverCallback} callback
   */
  constructor(callback, { pointerLock = false, pointerCapture = false } = {}) {
    this.pointerLock = pointerLock;
    this.pointerCapture = pointerCapture;

    this._elementsData = new Map();
    this._callback = callback;

    this._onPointerDownBound = this._onPointerDown.bind(this);
    this._onPointerMoveBound = this._onPointerMove.bind(this);
    this._onPointerUpBound = this._onPointerUp.bind(this);
  }

  /**
   * Observe gesture changes on the specified target element.
   * @param {HTMLElement|Window} element Element to observe
   */
  observe(element) {
    if (this._elementsData.has(element)) {
      return;
    }
    element.addEventListener('pointerdown', this._onPointerDownBound);
    this._elementsData.set(element, {
      pointers: new Map(),
      gestureVector: new Vector2(),
      previousSize: 0,
      previousX: 0,
      previousY: 0,
      previousMovementX: 0,
      previousMovementY: 0,
      timeStamp: 0,
    });
  }

  /**
   * Stop observing gesture changes on the specified target element.
   * @param {HTMLElement|Window} element Element to unobserve
   */
  unobserve(element) {
    if (!this._elementsData.has(element)) {
      return;
    }
    element.removeEventListener('pointerdown', this._onPointerDownBound);
    element.removeEventListener('pointermove', this._onPointerMoveBound);
    this._elementsData.delete(element);
  }

  /**
   * Stops watching all of its target elements for gesture changes.
   */
  disconnect() {
    for (const element of this._elementsData.keys()) {
      this.unobserve(element);
    }
  }

  _resetElementData(element) {
    const data = this._elementsData.get(element);
    data.gestureVector.set(0, 0);
    data.previousSize = 0;
    data.previousX = 0;
    data.previousY = 0;
    data.previousRotation = 0;
    data.timeStamp = 0;
  }

  _onPointerDown(event) {
    const element = event.currentTarget;
    const data = this._elementsData.get(element);
    if (this.pointerLock) {
      element.requestPointerLock();
    } else if (this.pointerCapture) {
      element.setPointerCapture(event.pointerId);
    }
    this._resetElementData(element);
    if (!data.pointers.size) {
      element.addEventListener('pointermove', this._onPointerMoveBound);
      element.addEventListener('pointerup', this._onPointerUpBound);
      element.addEventListener('pointerout', this._onPointerUpBound);
      data.timeStamp = Date.now();
    }
    data.pointers.set(event.pointerId, event);
  }

  _onPointerMove(event) {
    const data = this._elementsData.get(event.currentTarget);
    data.pointers.set(event.pointerId, event);
    let x = 0;
    let y = 0;
    let index = 0;
    for (const pointer of data.pointers.values()) {
      if (index === 1) {
        data.gestureVector.x = x - pointer.screenX;
        data.gestureVector.y = y - pointer.screenY;
      }
      x += pointer.screenX;
      y += pointer.screenY;
      index++;
    }
    x /= data.pointers.size;
    y /= data.pointers.size;

    if (!data.previousX && !data.previousY) {
      data.previousX = x;
      data.previousY = y;
      return;
    }

    const movementX = x - data.previousX;
    const movementY = y - data.previousY;
    data.previousX = x;
    data.previousY = y;
    data.previousMovementX = movementX;
    data.previousMovementY = movementY;

    const size = data.gestureVector.size;
    const movementScale = data.previousSize ? size - data.previousSize : 0;
    data.previousSize = size;

    const rotation = Math.atan2(data.gestureVector.y, data.gestureVector.x);
    let movementRotation = data.previousRotation ? rotation - data.previousRotation : 0;
    if (movementRotation > Math.PI) {
      movementRotation -= Math.PI * 2;
    } else if (movementRotation < -Math.PI) {
      movementRotation += Math.PI * 2;
    }
    data.previousRotation = rotation;

    this._callback({
      target: event.currentTarget,
      movementX: this.pointerLock ? event.movementX / devicePixelRatio : movementX,
      movementY: this.pointerLock ? event.movementY / devicePixelRatio : movementY,
      movementScale,
      movementRotation,
      isSwipe: false,
    });
  }

  _onPointerUp(event) {
    const element = event.currentTarget;
    const data = this._elementsData.get(element);
    if (data) {
      if (Date.now() - data.timeStamp < 1000) {
        this._callback({
          target: event.currentTarget,
          movementX: data.previousMovementX,
          movementY: data.previousMovementY,
          movementScale: 0,
          movementRotation: 0,
          isSwipe: true,
        });
      }
      data.pointers.delete(event.pointerId);
      this._resetElementData(element);
    }
    element.releasePointerCapture(event.pointerId);
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
    if (!data || !data.pointers.size) {
      element.removeEventListener('pointermove', this._onPointerMoveBound);
      element.removeEventListener('pointerup', this._onPointerUpBound);
      element.removeEventListener('pointerout', this._onPointerUpBound);
    }
  }
}

export default GestureObserver;
