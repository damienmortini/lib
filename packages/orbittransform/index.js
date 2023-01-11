import { Matrix4 } from '@damienmortini/math'
import { GestureObserver } from '@damienmortini/gestureobserver'

export class OrbitTransform {
  #selfMatrix = new Matrix4()
  #distance
  #tilt
  #pan

  constructor({
    matrix = new Matrix4(),
    domElement = null,
    pan = 0,
    tilt = 0,
    inverted = false,
    distance = 0,
    distanceMin = 0,
    distanceMax = Infinity,
    tiltMin = -Infinity,
    tiltMax = Infinity,
    tiltDisabled = false,
    panMin = -Infinity,
    panMax = Infinity,
    panDisabled = false,
    rotationEasing = 0.1,
    rotationVelocity = 0.005,
    zoomEasing = 0.1,
    zoomVelocity = 0.1,
    zoomDisabled = false,
  }) {
    this.matrix = matrix
    this.inverted = inverted
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
      domElement.addEventListener(
        'wheel',
        (event) => {
          if (this.zoomDisabled) return
          this.distanceEnd = Math.max(this.distanceEnd, 0.001) * (1 + event.deltaY * this.zoomVelocity * 0.01)
          this.distanceEnd = Math.max(this.distanceMin, Math.min(this.distanceMax, this.distanceEnd))
        },
        { passive: true },
      )

      const gestureObserver = new GestureObserver((gesture) => {
        if (!this.panDisabled) {
          this.panEnd += gesture.movementX * this.rotationVelocity
          this.panEnd = Math.max(this.panMin, Math.min(this.panMax, this.panEnd))
        }

        if (!this.tiltDisabled) {
          this.tiltEnd += gesture.movementY * this.rotationVelocity
          this.tiltEnd = Math.max(this.tiltMin, Math.min(this.tiltMax, this.tiltEnd))
        }

        if (!this.zoomDisabled) {
          this.distanceEnd *= 1 + (1 - gesture.movementScale) * this.zoomVelocity * 10
          this.distanceEnd = Math.max(this.distanceMin, Math.min(this.distanceMax, this.distanceEnd))
        }
      })
      gestureObserver.observe(domElement, { pointerCapture: true })
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
    this.#selfMatrix.rotateY(-this.#pan)
    this.#selfMatrix.rotateX(-this.#tilt)
    const sinPan = Math.sin(-this.#pan)
    const cosPan = Math.cos(-this.#pan)
    const cosTilt = Math.cos(this.#tilt)
    const sinTilt = Math.sin(this.#tilt)
    this.#selfMatrix.x = this.#distance * sinPan * cosTilt
    this.#selfMatrix.y = sinTilt * this.#distance
    this.#selfMatrix.z = this.#distance * cosPan * cosTilt

    if (this.inverted) this.#selfMatrix.invert()

    this.matrix.multiply(this.#selfMatrix)
  }
}
