import { mat4 } from "gl-matrix";

export default class Matrix4 {
  static get elements() {
    return mat4;
  }

  constructor() {
    this.elements = mat4.create();
    return this;
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
    if(matrix4b) {
      mat4.multiply(this.elements, matrix4a.elements, matrix4b.elements);
    } else {
      mat4.multiply(this.elements, this.elements, matrix4a.elements);
    }
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
