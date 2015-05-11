export default class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    return this;
  }

  set (x = this.x, y = this.y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy (vector2) {
    this.x = vector2.x;
    this.y = vector2.y;
    return this;
  }

  add (vector2) {
    this.x += vector2.x;
    this.y += vector2.y;
    return this;
  }

  dot (vector2) {
    return this.x * vector2.x + this.y * vector2.y;
  }

  angleTo (vector2) {
    return Math.atan2( this.x * vector2.y - this.y * vector2.x, this.x * vector2.x + this.y * vector2.y );
  }
}
