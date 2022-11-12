class GestureObserver {
  #elementsData = new Map()
  #callback

  /**
   * @typedef Gesture
   * @property {HTMLElement} target - The target DOM Element
   * @property {Map<number, PointerEvent>} pointers - Map of active pointers
   * @property {Event} event - Event that triggered the gesture
   * @property {number} x - Gesture position on the X axis
   * @property {number} y - Gesture position on the Y axis
   * @property {number} movementX - Movement on the X axis
   * @property {number} movementY - Movement on the Y axis
   * @property {number} offsetX - Offset between gesture start and gesture end on the X axis
   * @property {number} offsetY - Offset between gesture start and gesture end on the Y axis
   * @property {number} movementScale - Pinch-zoom movement
   * @property {number} movementRotation - Angular movement in radians
   * @property {number} duration - Duration of the gesture
   * @property {("starting"|"moving"|"finishing")} state - State of the gesture
   */
  /**
   * @callback GestureObserverCallback
   * @param {Gesture} gesture - Current gesture changes
   */
  /**
   * @param {GestureObserverCallback} callback
   */
  constructor(callback) {
    this.#callback = callback
  }

  /**
   * Observe gesture changes on the specified target element.
   * @param {HTMLElement|Window} element Element to observe
   */
  observe(element, { pointerLock = false, pointerCapture = false } = {}) {
    let elementData = this.#elementsData.get(element)
    if (!elementData) {
      elementData = {
        pointers: new Map(),
        gestureVectorX: 0,
        gestureVectorY: 0,
        previousSize: 0,
        previousX: 0,
        previousY: 0,
        offsetX: 0,
        offsetY: 0,
        previousMovementX: 0,
        previousMovementY: 0,
        previousRotation: 0,
        startTimeStamp: 0,
        pointerLock: false,
        pointerCapture: false,
      }
      this.#elementsData.set(element, elementData)
    }
    elementData.pointerLock = pointerLock
    elementData.pointerCapture = pointerCapture
    element.addEventListener('pointerdown', this.#onPointerDown)
  }

  /**
   * Stop observing gesture changes on the specified target element.
   * @param {HTMLElement|Window} element Element to unobserve
   */
  unobserve(element) {
    if (!this.#elementsData.has(element)) return
    element.removeEventListener('pointerdown', this.#onPointerDown)
    element.removeEventListener('pointermove', this.#onPointerMove)
    this.#elementsData.delete(element)
  }

  /**
   * Stops watching all of its target elements for gesture changes.
   */
  disconnect() {
    for (const element of this.#elementsData.keys()) this.unobserve(element)
  }

  #resetElementPreviousData(element) {
    const data = this.#elementsData.get(element)
    data.gestureVectorX = 0
    data.gestureVectorY = 0
    data.previousSize = 0
    data.previousX = 0
    data.previousY = 0
    data.previousRotation = 0
  }

  #onPointerDown = (event) => {
    const element = event.currentTarget
    const data = this.#elementsData.get(element)

    if (data.pointerLock) element.requestPointerLock()
    else if (data.pointerCapture) element.setPointerCapture(event.pointerId)

    this.#resetElementPreviousData(element)
    data.pointers.set(event.pointerId, event)
    if (data.pointers.size === 1) {
      element.addEventListener('pointermove', this.#onPointerMove)
      element.addEventListener('pointerup', this.#onPointerUp)
      element.addEventListener('pointerout', this.#onPointerUp)
      data.startTimeStamp = Date.now()
      data.offsetX = 0
      data.offsetY = 0
      this.#callback({
        event,
        pointers: data.pointers,
        target: event.currentTarget,
        movementX: 0,
        movementY: 0,
        x: event.clientX,
        y: event.clientY,
        offsetX: 0,
        offsetY: 0,
        movementScale: 1,
        movementRotation: 0,
        duration: 0,
        state: 'starting',
      })
    }
  }

  #onPointerMove = (event) => {
    const data = this.#elementsData.get(event.currentTarget)
    data.pointers.set(event.pointerId, event)
    let x = 0
    let y = 0
    let index = 0
    for (const pointer of data.pointers.values()) {
      if (index === 1) {
        data.gestureVectorX = x - pointer.clientX
        data.gestureVectorY = y - pointer.clientY
      }
      x += pointer.clientX
      y += pointer.clientY
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

    const size = Math.hypot(data.gestureVectorX, data.gestureVectorY)
    const movementScale = data.previousSize ? size / data.previousSize : 1
    data.previousSize = size

    const rotation = Math.atan2(data.gestureVectorY, data.gestureVectorX)
    let movementRotation = data.previousRotation ? rotation - data.previousRotation : 0
    if (movementRotation > Math.PI) {
      movementRotation -= Math.PI * 2
    } else if (movementRotation < -Math.PI) {
      movementRotation += Math.PI * 2
    }
    data.previousRotation = rotation

    data.offsetX += movementX
    data.offsetY += movementY

    this.#callback({
      event,
      pointers: data.pointers,
      target: event.currentTarget,
      movementX: data.pointerLock ? event.movementX / devicePixelRatio : movementX,
      movementY: data.pointerLock ? event.movementY / devicePixelRatio : movementY,
      x,
      y,
      offsetX: data.offsetX,
      offsetY: data.offsetY,
      movementScale,
      movementRotation,
      duration: Date.now() - data.startTimeStamp,
      state: 'moving',
    })
  }

  #onPointerUp = (event) => {
    const element = event.currentTarget
    const data = this.#elementsData.get(element)
    data?.pointers.delete(event.pointerId)
    element.releasePointerCapture(event.pointerId)
    if (document.exitPointerLock) {
      document.exitPointerLock()
    }
    if (!data || !data.pointers.size) {
      this.#callback({
        event,
        pointers: data.pointers,
        target: event.currentTarget,
        movementX: 0,
        movementY: 0,
        movementScale: 1,
        movementRotation: 0,
        x: data.previousX,
        y: data.previousY,
        offsetX: data.offsetX,
        offsetY: data.offsetY,
        duration: Date.now() - data.startTimeStamp,
        state: 'finishing',
      })
      element.removeEventListener('pointermove', this.#onPointerMove)
      element.removeEventListener('pointerup', this.#onPointerUp)
      element.removeEventListener('pointerout', this.#onPointerUp)
    }
    this.#resetElementPreviousData(element)
  }
}

export default GestureObserver
