import Matrix4 from '@damienmortini/math/Matrix4.js'
import GestureObserver from './GestureObserver.js'

export default class OrbitController {
  #selfMatrix = new Matrix4()
  #distance
  #tilt
  #pan

  constructor({
    matrix = new Matrix4(),
    domElement = null,
    pan = 0,
    tilt = 0,
    invertRotation = true,
    distance = 1,
    distanceMin = 0,
    distanceMax = Infinity,
    tiltMin = -Infinity,
    tiltMax = Infinity,
    tiltDisabled = false,
    panMin = -Infinity,
    panMax = Infinity,
    panDisabled = false,
    rotationEasing = .1,
    rotationVelocity = .005,
    zoomEasing = .1,
    zoomVelocity = .1,
    zoomDisabled = false,
  }) {
    this.matrix = matrix
    this.invertRotation = invertRotation
    this.distanceMax = distanceMax
    this.distanceMin = distanceMin
    this.zoomEasing = zoomEasing
    this.tiltMax = tiltMax
    this.tiltMin = tiltMin
    this.tiltDisabled = tiltDisabled
    this.panMax = panMax
    this.panMin = panMin
    this.panDisabled = panDisabled
    this.rotationEasing = rotationEasing
    this.rotationVelocity = rotationVelocity
    this.zoomDisabled = zoomDisabled
    this.zoomVelocity = zoomVelocity

    this.#distance = distance
    this.#tilt = tilt
    this.#pan = pan

    this.panEnd = this.#pan
    this.tiltEnd = this.#tilt
    this.distanceEnd = this.#distance

    if (domElement) {
      domElement.addEventListener('wheel', (event) => {
        if (this.zoomDisabled) return
        this.distanceEnd = Math.max(this.distanceEnd, .001) * (1 + event.deltaY * this.zoomVelocity * .01)
        this.distanceEnd = Math.max(this.distanceMin, Math.min(this.distanceMax, this.distanceEnd))
      }, { passive: true })

      const gestureObserver = new GestureObserver((gesture) => {
        if (!this.panDisabled) {
          this.panEnd += (this.invertRotation ? -1 : 1) * gesture.movementX * this.rotationVelocity
          this.panEnd = Math.max(this.panMin, Math.min(this.panMax, this.panEnd))
        }

        if (!this.tiltDisabled) {
          this.tiltEnd += (this.invertRotation ? 1 : -1) * gesture.movementY * this.rotationVelocity
          this.tiltEnd = Math.max(this.tiltMin, Math.min(this.tiltMax, this.tiltEnd))
        }

        if (!this.zoomDisabled) {
          this.distanceEnd *= 1 + (1 - gesture.movementScale) * this.zoomVelocity * 10
          this.distanceEnd = Math.max(this.distanceMin, Math.min(this.distanceMax, this.distanceEnd))
        }
      }, { pointerCapture: true })
      gestureObserver.observe(domElement)
    }

    this.update()
  }

  get pan() {
    return this.#pan
  }

  set pan(value) {
    value = Math.max(this.panMin, Math.min(this.panMax, value))
    this.#pan = value
    this.panEnd = value
  }

  get tilt() {
    return this.#tilt
  }

  set tilt(value) {
    value = Math.max(this.tiltMin, Math.min(this.tiltMax, value))
    this.#tilt = value
    this.tiltEnd = value
  }

  get distance() {
    return this.#distance
  }

  set distance(value) {
    value = Math.max(this.distanceMin, Math.min(this.distanceMax, value))
    this.#distance = value
    this.distanceEnd = value
  }

  update() {
    this.#tilt += (this.tiltEnd - this.#tilt) * this.rotationEasing
    this.#pan += (this.panEnd - this.#pan) * this.rotationEasing
    this.#distance += (this.distanceEnd - this.#distance) * this.zoomEasing

    this.#selfMatrix.invert()
    this.matrix.multiply(this.#selfMatrix)

    this.#selfMatrix.identity()
    this.#selfMatrix.rotateY(this.#pan)
    this.#selfMatrix.rotateX(-this.#tilt)
    const sinPan = Math.sin(this.#pan)
    const cosPan = Math.cos(this.#pan)
    const cosTilt = Math.cos(this.#tilt)
    const sinTilt = Math.sin(this.#tilt)
    this.#selfMatrix.x = this.#distance * sinPan * cosTilt
    this.#selfMatrix.y = sinTilt * this.#distance
    this.#selfMatrix.z = this.#distance * cosPan * cosTilt

    this.matrix.multiply(this.#selfMatrix)
  }
}
