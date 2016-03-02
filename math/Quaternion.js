import {quat} from "gl-matrix";

import Vector4 from "./Vector4.js";

export default class Matrix4 extends Vector4 {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    super(x, y, z, w);
    return this;
  }

  rotateX(angle) {
    quat.rotateX(this.elements, this.elements, angle);
    return this;
  }

  rotateY(angle) {
    quat.rotateY(this.elements, this.elements, angle);
    return this;
  }

  rotateZ(angle) {
    quat.rotateZ(this.elements, this.elements, angle);
    return this;
  }
}
