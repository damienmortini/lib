import {mat4} from "gl-matrix";

export default class Matrix4 {
  constructor() {
    this.components = mat4.create();
    return this;
  }

  translate(components, matrix4 = this) {
    mat4.translate(this.components, matrix4.components, components);
    return this;
  }

  rotateX(value, matrix4 = this) {
    mat4.rotateX(this.components, matrix4.components, value);
    return this;
  }

  rotateY(value, matrix4 = this) {
    mat4.rotateY(this.components, matrix4.components, value);
    return this;
  }

  rotateZ(value, matrix4 = this) {
    mat4.rotateZ(this.components, matrix4.components, value);
    return this;
  }

  copy(matrix4) {
    mat4.copy(this.components, matrix4.components);
    return this;
  }

  fromQuaternion(quaternion) {
    mat4.fromQuat(this.components, quaternion.components);
    return this;
  }

  invert(matrix4 = this) {
    mat4.invert(this.components, matrix4.components);
    return this;
  }
}
