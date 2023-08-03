import { Matrix4 } from './Matrix4.js'

export class Camera {
  transform = new Matrix4()

  #near: number
  #far: number
  #aspectRatio: number
  #fov: number
  #inverseTransform = new Matrix4()
  #projection = new Matrix4()
  #projectionView = new Matrix4()

  constructor({ near = 0.01, far = 1000, aspectRatio = 1, fov = Math.PI / 3 } = {}) {
    this.#near = near
    this.#far = far
    this.#aspectRatio = aspectRatio
    this.#fov = fov

    this.#updateProjection()
  }

  set near(value) {
    this.#near = value
    this.#updateProjection()
  }

  get near() {
    return this.#near
  }

  set far(value) {
    this.#far = value
    this.#updateProjection()
  }

  get far() {
    return this.#far
  }

  set fov(value) {
    this.#fov = value
    this.#updateProjection()
  }

  get fov() {
    return this.#fov
  }

  set aspectRatio(value) {
    this.#aspectRatio = value
    this.#updateProjection()
  }

  get aspectRatio() {
    return this.#aspectRatio
  }

  get inverseTransform() {
    return this.#inverseTransform.invert(this.transform)
  }

  get projection() {
    return this.#projection
  }

  get projectionView() {
    return this.#projectionView.copy(this.projection).multiply(this.inverseTransform)
  }

  #updateProjection() {
    this.#projection.fromPerspective(this.fov, this.aspectRatio, this.near, this.far)
  }
}

// Object.defineProperty(Camera.prototype, 'near', { enumerable: true, writable: true })
// Object.defineProperty(Camera.prototype, 'far', { enumerable: true, writable: true })
// Object.defineProperty(Camera.prototype, 'fov', { enumerable: true, writable: true })
// Object.defineProperty(Camera.prototype, 'aspectRatio', { enumerable: true, writable: true })
// Object.defineProperty(Camera.prototype, 'inverseTransform', { enumerable: true, writable: true })
// Object.defineProperty(Camera.prototype, 'projection', { enumerable: true, writable: true })
// Object.defineProperty(Camera.prototype, 'projectionView', { enumerable: true, writable: true })
