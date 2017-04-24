import Matrix4 from "dlib/math/Matrix4";

export default class Camera {
  constructor({near = 0, far = 1000, aspect = 1, fov = Math.PI / 2} = {}) {
    this._near = near;
    this._far = far;
    this._aspect = aspect;
    this._fov = fov;

    this.transform = new Matrix4();
    this._projectionMatrix = new Matrix4();
    this._projectionViewMatrix = new Matrix4();
    this._inverseMatrix = new Matrix4();

    this._updateProjectionMatrix();
  }

  set near(value) {
    this._near = value;
    this._updateProjectionMatrix();
  }

  get near() {
    return this._near;
  }

  set far(value) {
    this._far = value;
    this._updateProjectionMatrix();
  }

  get far() {
    return this._far;
  }

  set fov(value) {
    this._fov = value;
    this._updateProjectionMatrix();
  }

  get fov() {
    return this._fov;
  }

  set aspect(value) {
    this._aspect = value;
    this._updateProjectionMatrix();
  }

  get aspect() {
    return this._aspect;
  }

  get projectionMatrix() {
    return this._projectionMatrix;
  }

  get inverseMatrix() {
    return this._inverseMatrix.invert(this.transform);
  }

  get projectionViewMatrix() {
    return this._projectionViewMatrix.copy(this.projectionMatrix).multiply(this.inverseMatrix);
  }

  _updateProjectionMatrix() {
    this._projectionMatrix.fromPerspective(this);
  }
}
