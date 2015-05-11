import Vector2 from "../math/Vector2";

export default class Edge {
  constructor(a = new Vector2(), b = new Vector2()) {
    this.a = a;
    this.b = b;
    return this;
  }

  getCenter() {
    return this.getPointFromRatio(.5);
  }

  getPointFromRatio(ratio) {
    return new Vector2(this.a.x + (this.b.x - this.a.x) * ratio, this.a.y + (this.b.y - this.a.y) * ratio);
  }
}
