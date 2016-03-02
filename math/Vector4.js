import {vec4} from "gl-matrix";

export default class Vector4 {
  constructor(x = 0, y = 0, z = 0, w = 0) {
    this.elements = vec4.create();
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  get x() {
    return this.elements[0];
  }

  set x(value) {
    this.elements[0] = value;
  }

  get y() {
    return this.elements[1];
  }

  set y(value) {
    this.elements[1] = value;
  }

  get z() {
    return this.elements[2];
  }

  set z(value) {
    this.elements[2] = value;
  }

  get w() {
    return this.elements[3];
  }

  set w(value) {
    this.elements[3] = value;
  }
}
