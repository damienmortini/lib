import Polygon from '@damienmortini/math/Polygon.js';

export default class SubstratePolygon extends Polygon {
  constructor(vertices) {
    super(vertices);
    this.id = -1;
  }
}
