import Vec2 from "../node_modules/gl-matrix/src/gl-matrix/vec2.js";

export default class Vector2 {
  constructor(x = 0, y = 0) {
    this.components = Vec2.create();
    this.x = x;
    this.y = y;
    return this;
  }

  get x() {
    return this.components[0];
  }

  set x(value) {
    this.components[0] = value;
  }

  get y() {
    return this.components[1];
  }

  set y(value) {
    this.components[1] = value;
  }

  get length () {
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
    this.divideScalar(this.length);
  }

  addScalar(scalar) {
    this.x += scalar;
    this.y += scalar;
    return this;
  }

  multiplyScalar(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  divideScalar(scalar) {
    if ( scalar !== 0 ) {
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
    return Math.atan2( this.x * vector2.y - this.y * vector2.x, this.x * vector2.x + this.y * vector2.y );
  }
}
