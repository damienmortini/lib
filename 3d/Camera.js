import Matrix4 from "../math/Matrix4.js";

export default class Camera {
  constructor({ near = 0.01, far = 1000, aspectRatio = 1, fov = Math.PI / 3 } = {}) {
    this._near = near;
    this._far = far;
    this._aspectRatio = aspectRatio;
    this._fov = fov;

    this.transform = new Matrix4();
    this._inverseTransform = new Matrix4();
    this._projection = new Matrix4();
    this._projectionView = new Matrix4();

    this._updateProjection();
  }

  set near(value) {
    this._near = value;
    this._updateProjection();
  }

  get near() {
    return this._near;
  }

  set far(value) {
    this._far = value;
    this._updateProjection();
  }

  get far() {
    return this._far;
  }

  set fov(value) {
    this._fov = value;
    this._updateProjection();
  }

  get fov() {
    return this._fov;
  }

  set aspectRatio(value) {
    this._aspectRatio = value;
    this._updateProjection();
  }

  get aspectRatio() {
    return this._aspectRatio;
  }

  get inverseTransform() {
    return this._inverseTransform.invert(this.transform);
  }

  get projection() {
    return this._projection;
  }

  get projectionView() {
    return this._projectionView.set(this.projection).multiply(this.inverseTransform);
  }

  _updateProjection() {
    this._projection.fromPerspective(this);
  }
}

Object.defineProperty(Camera.prototype, "near", { enumerable: true });
Object.defineProperty(Camera.prototype, "far", { enumerable: true });
Object.defineProperty(Camera.prototype, "fov", { enumerable: true });
Object.defineProperty(Camera.prototype, "aspectRatio", { enumerable: true });
Object.defineProperty(Camera.prototype, "inverseTransform", { enumerable: true });
Object.defineProperty(Camera.prototype, "projection", { enumerable: true });
Object.defineProperty(Camera.prototype, "projectionView", { enumerable: true });
