import {quat} from "gl-matrix";

export default class Quat extends Float32Array {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    super(4);
    this.set(x, y, z, w);
    return this;
  }

  identity() {
    quat.identity(this);
    return this;
  }

  set(x, y, z, w) {
    quat.set(this, x, y, z, w);
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
}
