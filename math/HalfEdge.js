import Edge from "./Edge";

class TwinEdge extends Edge {
  constructor (a = new Vector2(), b = new Vector2()) {
    super(a, b);
    this.next = null;
    this.previous = null;
    this.twin = null;
  }
}

export default class HalfEdge extends TwinEdge {
  constructor(a, b) {
    super(a, b);

    this.twin = new TwinEdge(b, a);

    this.next = this.twin;
    this.previous = this.twin;

    this.twin.next = this;
    this.twin.previous = this;

    this.twin.twin = this;

    return this;
  }
}
