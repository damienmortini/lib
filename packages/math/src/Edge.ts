import { Vector2 } from './Vector2.js';

export class Edge {
  a: Vector2;
  b: Vector2;

  constructor(a = new Vector2(), b = new Vector2()) {
    this.a = a;
    this.b = b;
    return this;
  }

  get angle() {
    return Math.atan2(this.a.y - this.b.y, this.b.x - this.a.x);
  }

  getCenter() {
    return this.getPointFromRatio(0.5);
  }

  getPointFromRatio(ratio) {
    return new Vector2([this.a.x + (this.b.x - this.a.x) * ratio, this.a.y + (this.b.y - this.a.y) * ratio]);
  }
}

class TwinEdge extends Edge {
  next: TwinEdge | null = null;
  twin: TwinEdge | null = null;
}

export class HalfEdge extends TwinEdge {
  constructor(a, b) {
    super(a, b);
    this.twin = new TwinEdge(b, a);
    this.reset();
    return this;
  }

  reset() {
    this.next = this.twin;
    this.twin.next = this;
    this.twin.twin = this;
    return this;
  }
}
