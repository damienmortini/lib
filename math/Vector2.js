import { vec2 } from "gl-matrix";

export default class Vector2 {
  static get elements() {
    return vec2;
  }

  constructor(x = 0, y = 0) {
    this.elements = vec2.create();
    this.x = x;
    this.y = y;
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

  get length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  get angle() {
    return Math.atan2(this.y, -this.x);
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(vector2) {
    this.x = vector2.x;
    this.y = vector2.y;
    return this;
  }

  add(vector2) {
    this.x += vector2.x;
    this.y += vector2.y;
    return this;
  }

  normalize() {
    vec2.normalize(this.elements, this.elements);
  }

  lerp(vector2, value) {
    vec2.lerp(this.elements, this.elements, vector2.elements, value);
  }

  addScalar(scalar) {
    this.x += scalar;
    this.y += scalar;
    return this;
  }

  scale(value) {
    vec2.scale(this.elements, this.elements, value);
    return this;
  }

  multiplyScalar(value) {
    console.warn("Deprecated, use scale instead");
    return this.scale(value);
  }

  divideScalar(scalar) {
    if (scalar !== 0) {
      this.multiplyScalar(1 / scalar);
    } else {
      this.set(0, 0);
    }
    return this;
  }

  dot(vector2) {
    return this.x * vector2.x + this.y * vector2.y;
  }

  setFromAngle(angle) {
    this.set(Math.cos(angle), -Math.sin(angle));
  }

  angleTo(vector2) {
    return Math.atan2(this.x * vector2.y - this.y * vector2.x, this.x * vector2.x + this.y * vector2.y);
  }
}
