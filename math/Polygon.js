import Vector2 from "./Vector2.js";

export default class Polygon {
  constructor(vertices = []) {
    this.vertices = vertices;
  }

  copy(polygon) {
    this.vertices.length = 0;
    this.vertices.push(...polygon.vertices);
    return this;
  }
}
