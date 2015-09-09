import Mat4 from "../node_modules/gl-matrix/src/gl-matrix/mat4.js";

export default class Matrix4 {
  constructor() {
    this.components = Mat4.create();
    return this;
  }

  translate(components, matrix4 = this) {
    Mat4.translate(this.components, matrix4.components, components);
    return this;
  }

  rotateX(value, matrix4 = this) {
    Mat4.rotateX(this.components, matrix4.components, value);
    return this;
  }

  rotateY(value, matrix4 = this) {
    Mat4.rotateY(this.components, matrix4.components, value);
    return this;
  }

  rotateZ(value, matrix4 = this) {
    Mat4.rotateZ(this.components, matrix4.components, value);
    return this;
  }

  copy(matrix4) {
    Mat4.copy(this.components, matrix4.components);
    return this;
  }

  fromQuaternion(quaternion) {
    Mat4.fromQuat(this.components, quaternion.components);
    return this;
  }

  invert(matrix4 = this) {
    Mat4.invert(this.components, matrix4.components);
    return this;
  }
}
