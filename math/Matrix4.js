import mat4 from "gl-matrix/src/gl-matrix/mat4.js";

export default class Matrix4 extends Float32Array {
  constructor(array) {
    super(16);
    if(array) {
      this.copy(array);
    } else {
      this.identity();
    }
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

  copy(matrix4) {
    mat4.copy(this, matrix4);
    return this;
  }

  set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
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

  scale(vector3, matrix4 = this) {
    mat4.scale(this, matrix4, typeof vector3 === "number" ? [vector3, vector3, vector3] : vector3);
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

  fromPerspective({fov, aspectRatio, near, far} = {}) {
    mat4.perspective(this, fov, aspectRatio, near, far);
    return this;
  }

  fromQuaternion(quaternion) {
    mat4.fromQuat(this, quaternion);
    return this;
  }

  setPosition(vector3) {
    this.x = vector3.x;
    this.y = vector3.y;
    this.z = vector3.z;
    return this;
  }

  invert(matrix4 = this) {
    mat4.invert(this, matrix4);
    return this;
  }
}
