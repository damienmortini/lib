import {quat} from "gl-matrix";

export default class Quat {
  static get elements() {
    return quat;
  }

  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.elements = quat.create();
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  identity() {
    quat.identity(this.elements);
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
