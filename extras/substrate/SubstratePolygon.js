import Polygon from "../../math/Polygon";

export default class SubstratePolygon extends Polygon {
  constructor(vertices) {
    super(vertices);
    this.id = -1;
  }
}
