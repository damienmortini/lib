import mat4 from "../node_modules/gl-matrix/src/gl-matrix/mat4";

export default class Matrix4 {
  constructor() {
    this.components = mat4.create();
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
