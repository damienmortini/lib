import { vec3 } from "gl-matrix";

export default class Vector3 extends Float32Array {
  constructor(x = 0, y = 0, z = 0) {
    super(3);
    this.set(x, y, z);
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

  get length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  set(x, y, z) {
    vec3.set(this, x, y, z);
    return this;
  }

  copy(vector3) {
    vec3.copy(this, vector3);
    return this;
  }

  add(vector3) {
    vec3.add(this, this, vector3);
    return this;
  }

  subtract(vector3) {
    vec3.subtract(this, this, vector3);
    return this;
  }

  scale(value) {
    vec3.scale(this, this, value);
    return this;
  }

  normalize() {
    this.divideScalar(this.length);
  }

  divideScalar(scalar) {
    if (scalar !== 0) {
      let invScalar = 1 / scalar;
      this.x *= invScalar;
      this.y *= invScalar;
      this.z *= invScalar;
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }
    return this;
  }

  dot(vector3) {
    return this.x * vector3.x + this.y * vector3.y + this.z * vector3.z;
  }

  equals(vector3) {
    return vec3.exactEquals(this, vector3);
  }

  applyMatrix4(matrix4) {
    vec3.transformMat4(this, this, matrix4);
    return this;
  }

  angleTo(vector3) {
    // TODO: To test(from three.js)
    let theta = this.dot(vector3) / (this.length() * vector3.length());
    return Math.acos((theta < -1) ? -1 : ((theta > 1) ? 1 : theta));
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
}
