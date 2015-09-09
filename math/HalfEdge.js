import Edge from "./Edge.js";
import Vector2 from "./Vector2.js";

class TwinEdge extends Edge {
  constructor (a = new Vector2(), b = new Vector2()) {
    super(a, b);
    this.next = null;
    this.twin = null;
  }
}

export default class HalfEdge extends TwinEdge {
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
