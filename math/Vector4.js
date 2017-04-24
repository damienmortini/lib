import vec4 from "gl-matrix/src/gl-matrix/vec4.js";

export default class Vector4 extends Float32Array {
  constructor(x = 0, y = 0, z = 0, w = 0) {
    super(4);
    this.set(x, y, z, w);
    return this;
  }

  get x() {
    return this[0];
  }

  set x(value) {
    this[0] = value;
  }

  get y() {
    return this[1];
  }

  set y(value) {
    this[1] = value;
  }

  get z() {
    return this[2];
  }

  set z(value) {
    this[2] = value;
  }

  get w() {
    return this[3];
  }

  set w(value) {
    this[3] = value;
  }

  set(x, y, z, w) {
    vec4.set(this, x, y, z, w);
    return this;
  }
}
