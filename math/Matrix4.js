import { mat4 } from "gl-matrix";

export default class Matrix4 {
  static get elements() {
    return mat4;
  }

  constructor() {
    this.elements = mat4.create();
    return this;
  }

  set x(value) {
    this.elements[12] = value;
  }

  get x() {
    return this.elements[12];
  }

  set y(value) {
    this.elements[13] = value;
  }

  get y() {
    return this.elements[13];
  }

  set z(value) {
    this.elements[14] = value;
  }

  get z() {
    return this.elements[14];
  }

  set w(value) {
    this.elements[15] = value;
  }

  get w() {
    return this.elements[15];
  }

  translate(elements, matrix4 = this) {
    mat4.translate(this.elements, matrix4.elements, elements);
    return this;
  }

  rotateX(value, matrix4 = this) {
    mat4.rotateX(this.elements, matrix4.elements, value);
    return this;
  }

  rotateY(value, matrix4 = this) {
    mat4.rotateY(this.elements, matrix4.elements, value);
    return this;
  }

  rotateZ(value, matrix4 = this) {
    mat4.rotateZ(this.elements, matrix4.elements, value);
    return this;
  }

  multiply(matrix4a, matrix4b) {
    if (matrix4b) {
      mat4.multiply(this.elements, matrix4a.elements, matrix4b.elements);
    } else {
      mat4.multiply(this.elements, this.elements, matrix4a.elements);
    }
    return this;
  }

  perspective (fovy, aspect, near, far) {
    mat4.perspective(this.elements, fovy, aspect, near, far);
    return this;
  }

  identity() {
    mat4.identity(this.elements);
    return this;
  }

  copy(matrix4) {
    mat4.copy(this.elements, matrix4.elements);
    return this;
  }

  fromQuaternion(quaternion) {
    mat4.fromQuat(this.elements, quaternion.elements);
    return this;
  }

  invert(matrix4 = this) {
    mat4.invert(this.elements, matrix4.elements);
    return this;
  }
}
