import Vector2 from "./Vector2";

export default class Polygon {
  constructor(vertices = []) {
    this.vertices = vertices;
  }

  copy(polygon) {
    this.vertices = [];
    for(let vertex of polygon.vertices) {
      this.vertices.push(new Vector2().copy(vertex));
    }
    return this;
  }
}
