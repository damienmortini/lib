import * as vec3 from "../../gl-matrix/esm/vec3.js";

export default class Vector3 extends Float32Array {
  constructor(array = [0, 0, 0]) {
    super(array);
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

  get size() {
    return vec3.length(this);
  }

  get squaredSize() {
    return vec3.squaredLength(this);
  }

  distance(vector3) {
    return vec3.distance(this, vector3);
  }

  squaredDistance(vector3) {
    return vec3.squaredDistance(this, vector3);
  }

  subtract(vector3) {
    vec3.subtract(this, this, vector3);
    return this;
  }

  negate(vector3 = this) {
    vec3.negate(this, vector3);
    return this;
  }

  cross(vector3a, vector3b) {
    vec3.cross(this, vector3a, vector3b);
    return this;
  }

  scale(value) {
    vec3.scale(this, this, value);
    return this;
  }

  normalize() {
    vec3.normalize(this, this);
    return this;
  }

  dot(vector3) {
    return vec3.dot(this, vector3);
  }

  lerp(vector3, value) {
    return vec3.lerp(this, this, vector3, value);
  }

  equals(vector3) {
    return vec3.exactEquals(this, vector3);
  }

  applyMatrix4(matrix4) {
    vec3.transformMat4(this, this, matrix4);
    return this;
  }

  angle(vector3) {
    return vec3.angle(this, vector3);
  }

  clone() {
    return new Vector3(this);
  }
}
