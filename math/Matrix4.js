import * as mat4 from "../../gl-matrix/esm/mat4.js";

export default class Matrix4 extends Float32Array {
  constructor(array = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) {
    super(array);
    return this;
  }

  set x(value) {
    this[12] = value;
  }

  get x() {
    return this[12];
  }

  set y(value) {
    this[13] = value;
  }

  get y() {
    return this[13];
  }

  set z(value) {
    this[14] = value;
  }

  get z() {
    return this[14];
  }

  set w(value) {
    this[15] = value;
  }

  get w() {
    return this[15];
  }

  set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    if (m00.length) {
      return this.copy(m00);
    }
    mat4.set(this, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
    return this;
  }

  translate(vector3, matrix4 = this) {
    mat4.translate(this, matrix4, vector3);
    return this;
  }

  rotateX(value, matrix4 = this) {
    mat4.rotateX(this, matrix4, value);
    return this;
  }

  rotateY(value, matrix4 = this) {
    mat4.rotateY(this, matrix4, value);
    return this;
  }

  rotateZ(value, matrix4 = this) {
    mat4.rotateZ(this, matrix4, value);
    return this;
  }

  scale(value, matrix4 = this) {
    mat4.scale(this, matrix4, typeof value === "number" ? [value, value, value] : value);
    return this;
  }

  multiply(matrix4a, matrix4b) {
    if (matrix4b) {
      mat4.multiply(this, matrix4a, matrix4b);
    } else {
      mat4.multiply(this, this, matrix4a);
    }
    return this;
  }

  identity() {
    mat4.identity(this);
    return this;
  }

  copy(matrix4) {
    mat4.copy(this, matrix4);
    return this;
  }

  fromPerspective({ fov, aspectRatio, near, far }) {
    mat4.perspective(this, fov, aspectRatio, near, far);
    return this;
  }

  fromQuaternion(quaternion) {
    mat4.fromQuat(this, quaternion);
    return this;
  }

  setPosition(vector3) {
    this.x = vector3[0];
    this.y = vector3[1];
    this.z = vector3[2];
    return this;
  }

  invert(matrix4 = this) {
    mat4.invert(this, matrix4);
    return this;
  }
}
