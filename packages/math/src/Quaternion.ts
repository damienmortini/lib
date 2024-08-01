import { quat } from 'gl-matrix/esm/index.js';
import { mat4 } from 'gl-matrix/esm/index.js';

export class Quaternion extends Float32Array {
  constructor(array = [0, 0, 0, 1]) {
    super(array);
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

  slerp(quaternion, value) {
    return quat.slerp(this, this, quaternion, value);
  }

  normalize(quaternion = this) {
    quat.normalize(this, quaternion);
    return this;
  }

  multiply(quaternionA, quaternionB) {
    if (quaternionB) {
      quat.multiply(this, quaternionA, quaternionB);
    }
    else {
      quat.multiply(this, this, quaternionA);
    }
    return this;
  }

  fromMatrix3(matrix3) {
    quat.fromMat3(this, matrix3);
    return this;
  }

  fromMatrix4(matrix4) {
    mat4.getRotation(this, matrix4);
    return this;
  }

  fromAxisAngle(axis, angle) {
    quat.setAxisAngle(this, axis, angle);
    return this;
  }

  betweenVectors(vector3a, vector3b) {
    quat.rotationTo(this, vector3a, vector3b);
    return this;
  }

  computeW(quaternion = this) {
    quat.calculateW(this, quaternion);
    return this;
  }
}
