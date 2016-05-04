import { vec3 } from "gl-matrix";

export default class Vector3 {
  static get elements() {
    return vec3;
  }

  constructor(x = 0, y = 0, z = 0) {
    this.elements = vec3.create();
    this.x = x;
    this.y = y;
    this.z = z;
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

  get length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  set(x, y, z) {
    vec3.set(this.elements, x, y, z);
    return this;
  }

  copy(vector3) {
    this.x = vector3.x;
    this.y = vector3.y;
    this.z = vector3.z;
    return this;
  }

  add(vector3) {
    this.x += vector3.x;
    this.y += vector3.y;
    this.z += vector3.z;
    return this;
  }

  scale(value) {
    vec3.scale(this.elements, this.elements, value);
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
    return vec3.exactEquals(this.elements, vector3.elements);
  }

  applyMatrix4(matrix4) {
    vec3.transformMat4(this.elements, this.elements, matrix4.elements);
    return this;
  }

  angleTo(vector3) {
    // TODO: To test(from three.js)
    let theta = this.dot(vector3) / (this.length() * vector3.length());
    return Math.acos((theta < -1) ? -1 : ((theta > 1) ? 1 : theta));
  }
}
