import * as quat from "../../gl-matrix/esm/quat.js";

export default class Quaternion extends Float32Array {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    super(4);
    this.set(x, y, z, w);
    return this;
  }

  get x() {
    return this[0];
  }

  set x(value) {
    this[0] = value;
  }

  get y() {
    return this[1];
  }

  set y(value) {
    this[1] = value;
  }

  get z() {
    return this[2];
  }

  set z(value) {
    this[2] = value;
  }

  get w() {
    return this[3];
  }

  set w(value) {
    this[3] = value;
  }

  identity() {
    quat.identity(this);
    return this;
  }

  set(x, y, z, w) {
    quat.set(this, x, y, z, w);
    return this;
  }

  rotateX(angle) {
    quat.rotateX(this, this, angle);
    return this;
  }

  rotateY(angle) {
    quat.rotateY(this, this, angle);
    return this;
  }

  rotateZ(angle) {
    quat.rotateZ(this, this, angle);
    return this;
  }

  invert(quaternion = this) {
    quat.invert(this, quaternion);
    return this;
  }

  copy(quaternion) {
    quat.copy(this, quaternion);
    return this;
  }

  normalize(quaternion = this) {
    quat.normalize(this, this);
    return this;
  }

  multiply(quaternionA, quaternionB) {
    if (quaternionB) {
      quat.multiply(this, quaternionA, quaternionB);
    } else {
      quat.multiply(this, this, quaternionA);
    }
    return this;
  }

  fromMatrix3(matrix3) {
    quat.fromMat3(this, matrix3);
    return this;
  }
}
