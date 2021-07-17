import Vector2 from '../math/Vector2.js'

class GestureObserver {
  /**
   * @typedef Gesture
   * @property {HTMLElement} target - The target DOM Element
   * @property {number} movementX - Movement on the X axis
   * @property {number} movementY - Movement on the Y axis
   * @property {number} offsetX - Offset between gesture start and gesture end on the X axis
   * @property {number} offsetY - Offset between gesture start and gesture end on the Y axis
   * @property {number} movementScale - Pinch-zoom movement
   * @property {number} movementRotation - Angular movement in radians
   * @property {number} duration - Duration of the gesture
   * @property {boolean} finished - Is the gesture finished
   */
  /**
   * @callback GestureObserverCallback
   * @param {Gesture} gesture - Current gesture changes
   */
  /**
   * @param {GestureObserverCallback} callback
   */
  constructor(callback, { pointerLock = false, pointerCapture = false } = {}) {
    this.pointerLock = pointerLock
    this.pointerCapture = pointerCapture

    this._elementsData = new Map()
    this._callback = callback

    this._onPointerDownBound = this._onPointerDown.bind(this)
    this._onPointerMoveBound = this._onPointerMove.bind(this)
    this._onPointerUpBound = this._onPointerUp.bind(this)
  }

  /**
   * Observe gesture changes on the specified target element.
   * @param {HTMLElement|Window} element Element to observe
   */
  observe(element) {
    if (this._elementsData.has(element)) {
      return
    }
    element.addEventListener('pointerdown', this._onPointerDownBound)
    this._elementsData.set(element, {
      pointers: new Map(),
      gestureVector: new Vector2(),
      previousSize: 0,
      previousX: 0,
      previousY: 0,
      offsetX: 0,
      offsetY: 0,
      previousMovementX: 0,
      previousMovementY: 0,
      startTimeStamp: 0,
    })
  }

  /**
   * Stop observing gesture changes on the specified target element.
   * @param {HTMLElement|Window} element Element to unobserve
   */
  unobserve(element) {
    if (!this._elementsData.has(element)) {
      return
    }
    element.removeEventListener('pointerdown', this._onPointerDownBound)
    element.removeEventListener('pointermove', this._onPointerMoveBound)
    this._elementsData.delete(element)
  }

  /**
   * Stops watching all of its target elements for gesture changes.
   */
  disconnect() {
    for (const element of this._elementsData.keys()) {
      this.unobserve(element)
    }
  }

  _resetElementPreviousData(element) {
    const data = this._elementsData.get(element)
    data.gestureVector.set(0, 0)
    data.previousSize = 0
    data.previousX = 0
    data.previousY = 0
    data.previousRotation = 0
  }

  _onPointerDown(event) {
    const element = event.currentTarget
    const data = this._elementsData.get(element)
    if (this.pointerLock) {
      element.requestPointerLock()
    } else if (this.pointerCapture) {
      element.setPointerCapture(event.pointerId)
    }
    this._resetElementPreviousData(element)
    if (!data.pointers.size) {
      element.addEventListener('pointermove', this._onPointerMoveBound)
      element.addEventListener('pointerup', this._onPointerUpBound)
      element.addEventListener('pointerout', this._onPointerUpBound)
      data.startTimeStamp = Date.now()
      data.offsetX = 0
      data.offsetY = 0
    }
    data.pointers.set(event.pointerId, event)
  }

  _onPointerMove(event) {
    const data = this._elementsData.get(event.currentTarget)
    data.pointers.set(event.pointerId, event)
    let x = 0
    let y = 0
    let index = 0
    for (const pointer of data.pointers.values()) {
      if (index === 1) {
        data.gestureVector.x = x - pointer.screenX
        data.gestureVector.y = y - pointer.screenY
      }
      x += pointer.screenX
      y += pointer.screenY
      index++
    }
    x /= data.pointers.size
    y /= data.pointers.size

    if (!data.previousX && !data.previousY) {
      data.previousX = x
      data.previousY = y
      return
    }

    const movementX = x - data.previousX
    const movementY = y - data.previousY
    data.previousX = x
    data.previousY = y
    data.previousMovementX = movementX
    data.previousMovementY = movementY

    const size = data.gestureVector.size
    const movementScale = data.previousSize ? size / data.previousSize : 1
    data.previousSize = size

    const rotation = Math.atan2(data.gestureVector.y, data.gestureVector.x)
    let movementRotation = data.previousRotation ? rotation - data.previousRotation : 0
    if (movementRotation > Math.PI) {
      movementRotation -= Math.PI * 2
    } else if (movementRotation < -Math.PI) {
      movementRotation += Math.PI * 2
    }
    data.previousRotation = rotation

    data.offsetX += movementX
    data.offsetY += movementY

    this._callback({
      target: event.currentTarget,
      movementX: this.pointerLock ? event.movementX / devicePixelRatio : movementX,
      movementY: this.pointerLock ? event.movementY / devicePixelRatio : movementY,
      offsetX: data.offsetX,
      offsetY: data.offsetY,
      movementScale,
      movementRotation,
      duration: Date.now() - data.startTimeStamp,
      finished: false,
    })
  }

  _onPointerUp(event) {
    const element = event.currentTarget
    const data = this._elementsData.get(element)
    data.pointers.delete(event.pointerId)
    element.releasePointerCapture(event.pointerId)
    if (document.exitPointerLock) {
      document.exitPointerLock()
    }
    if (!data || !data.pointers.size) {
      this._callback({
        target: event.currentTarget,
        movementX: 0,
        movementY: 0,
        movementScale: 1,
        movementRotation: 0,
        offsetX: data.offsetX,
        offsetY: data.offsetY,
        duration: Date.now() - data.startTimeStamp,
        finished: true,
      })
      element.removeEventListener('pointermove', this._onPointerMoveBound)
      element.removeEventListener('pointerup', this._onPointerUpBound)
      element.removeEventListener('pointerout', this._onPointerUpBound)
    }
    this._resetElementPreviousData(element)
  }
}

export default GestureObserver
