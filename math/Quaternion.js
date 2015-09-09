import quat from "../node_modules/gl-matrix/src/gl-matrix/quat.js";

import Vector4 from "./Vector4.js";

export default class Matrix4 extends Vector4 {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    super(x, y, z, w);
    return this;
  }

  rotateX(angle) {
    quat.rotateX(this.components, this.components, angle);
    return this;
  }

  rotateY(angle) {
    quat.rotateY(this.components, this.components, angle);
    return this;
  }

  rotateZ(angle) {
    quat.rotateZ(this.components, this.components, angle);
    return this;
  }
}
