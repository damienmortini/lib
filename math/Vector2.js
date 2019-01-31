import * as vec2 from "../../gl-matrix/esm/vec2.js";

export default class Vector2 extends Float32Array {
  static distance(vector2a, vector2b) {
    return vec2.distance(vector2a, vector2b);
  }

  constructor(array = [0, 0]) {
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

  set(x, y) {
    vec2.set(this, x, y);
    return this;
  }

  copy(vector2) {
    vec2.copy(this, vector2);
    return this;
  }

  add(vector2) {
    vec2.add(this, this, vector2);
    return this;
  }

  get size() {
    return vec2.length(this);
  }

  get squaredSize() {
    return vec2.squaredLength(this);
  }

  subtract(vector2) {
    vec2.subtract(this, this, vector2);
    return this;
  }

  negate(vector2 = this) {
    vec2.negate(this, vector2);
    return this;
  }

  cross(vector2a, vector2b) {
    vec2.cross(this, vector2a, vector2b);
    return this;
  }

  scale(value) {
    vec2.scale(this, this, value);
    return this;
  }

  normalize() {
    vec2.normalize(this, this);
  }

  dot(vector2) {
    return vec2.dot(this, vector2);
  }

  distance(vector2) {
    return Vector2.distance(this, vector2);
  }

  equals(vector2) {
    return vec2.exactEquals(this, vector2);
  }

  applyMatrix3(matrix3) {
    vec2.transformMat3(this, this, matrix3);
    return this;
  }

  applyMatrix4(matrix4) {
    vec2.transformMat4(this, this, matrix4);
    return this;
  }

  lerp(vector2, value) {
    vec2.lerp(this, this, vector2, value);
  }

  clone() {
    return new Vector2(this);
  }
}
