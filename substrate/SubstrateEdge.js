import HalfEdge from "../math/HalfEdge";

export default class SubstrateEdge extends HalfEdge {
  constructor(a, boid) {
    super(a, boid.position);
    this.boid = boid;
    this.id = -1;
  }
}
