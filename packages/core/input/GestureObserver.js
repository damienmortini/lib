import Vector2 from '../math/Vector2.js';

export default class GestureObserver {
  /**
   * @typedef Gesture
   * @property {HTMLElement} target - Movement on the X axis
   * @property {number} movementX - Movement on the X axis
   * @property {number} movementY - Movement on the Y axis
   * @property {number} movementScale - Pinch-zoom movement
   * @property {number} movementRotation - Angular movement in radians
   */
  /**
   * Callback for adding two numbers.
   * @callback GestureObserverCallback
   * @param {Gesture} gesture - Current gesture changes
   */
  /**
   * @param {GestureObserverCallback} callback
   */
  constructor(callback) {
    this._elementsData = new Map();
    this._callback = callback;

    this._onPointerDownBinded = this._onPointerDown.bind(this);
    this._onPointerMoveBinded = this._onPointerMove.bind(this);
    this._onPointerUpBinded = this._onPointerUp.bind(this);
  }

  /**
   * Observe gesture changes on the specified target element.
   * @param {HTMLElement|Window} element Element to observe
   */
  observe(element) {
    element.addEventListener('pointerdown', this._onPointerDownBinded);
    this._elementsData.set(element, {
      pointers: new Map(),
      gestureVector: new Vector2(),
      previousSize: 0,
      previousX: 0,
      previousY: 0,
    });
  }

  /**
   * Stop observing gesture changes on the specified target element.
   * @param {HTMLElement|Window} element Element to unobserve
   */
  unobserve(element) {
    element.removeEventListener('pointerdown', this._onPointerDownBinded);
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
  }

  _onPointerDown(event) {
    const element = event.currentTarget;
    const data = this._elementsData.get(element);
    if (!data.pointers.size) {
      element.addEventListener('pointermove', this._onPointerMoveBinded);
      element.addEventListener('pointerup', this._onPointerUpBinded);
      element.addEventListener('pointerout', this._onPointerUpBinded);
    }
    element.setPointerCapture(event.pointerId);
    data.pointers.set(event.pointerId, event);
    this._resetElementData(element);
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
      movementX,
      movementY,
      movementScale,
      movementRotation,
    });
  }

  _onPointerUp(event) {
    const element = event.currentTarget;
    const data = this._elementsData.get(element);
    data.pointers.delete(event.pointerId);
    element.releasePointerCapture(event.pointerId);
    this._resetElementData(element);
    if (!data.pointers.size) {
      element.removeEventListener('pointermove', this._onPointerMoveBinded);
      element.removeEventListener('pointerup', this._onPointerUpBinded);
      element.removeEventListener('pointerout', this._onPointerUpBinded);
    }
  }
}
