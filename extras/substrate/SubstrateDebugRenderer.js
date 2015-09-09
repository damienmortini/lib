import Vector3 from "../../math/Vector3.js";

export default class SubstrateDebugRenderer {
  constructor(substrateSystem, {canvas = document.createElement("canvas"), edgesDebug = false, polygonsDebug = false}) {
    this.substrateSystem = substrateSystem;
    this.canvas = canvas;
    this.edgesDebug = edgesDebug;
    this.polygonsDebug = polygonsDebug;

    this.canvas.width = this.substrateSystem.width;
    this.canvas.height = this.substrateSystem.height;
    this.context = canvas.getContext("2d");

    this._cachedVector3 = new Vector3();

    this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  update () {
    if (this.edgesDebug) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawEdges();
    }
    else {
      for (let i = 0; i < this.substrateSystem.data.length; i++) {
        let id = this.substrateSystem.data[i];
        if (id !== 0) {
          let debugColor = this.getDebugColor(id, this._cachedVector3);
          this.imageData.data[i * 4] = debugColor.x;
          this.imageData.data[i * 4 + 1] = debugColor.y;
          this.imageData.data[i * 4 + 2] = debugColor.z;
          this.imageData.data[i * 4 + 3] = 255;
        }
      }
      this.context.putImageData(this.imageData, 0, 0);
    }

    if (this.polygonsDebug) {
      this.drawPolygons();
    }
  }

  drawEdges () {
    for (let i = 0; i < this.substrateSystem.edges.length; i++) {
      let edge = this.substrateSystem.edges[i];

      let debugColor = this.getDebugColor(edge.id, this._cachedVector3);

      this.context.strokeStyle = `rgb(${debugColor.x}, ${debugColor.y}, ${debugColor.z})`;

      this.context.beginPath();
      this.context.setLineDash([]);
      this.context.moveTo(edge.a.x, edge.a.y);
      this.context.lineTo(edge.b.x, edge.b.y);
      this.context.arc(edge.b.x, edge.b.y, 2, 0, Math.PI * 2);
      this.context.stroke();

      this.context.beginPath();
      this.context.setLineDash([2, 8]);

      let p1;
      let p2;

      p1 = edge.getPointFromRatio(.6);
      p2 = edge.next.getPointFromRatio(.4);

      this.context.moveTo(p1.x, p1.y);
      this.context.quadraticCurveTo(edge.next.a.x, edge.next.a.y, p2.x, p2.y);

      p1 = edge.twin.getPointFromRatio(.6);
      p2 = edge.twin.next.getPointFromRatio(.4);

      this.context.moveTo(p1.x, p1.y);
      this.context.quadraticCurveTo(edge.twin.next.a.x, edge.twin.next.a.y, p2.x, p2.y);

      this.context.stroke();

      this.context.fillStyle = this.context.strokeStyle;
      let center = edge.getCenter();
      this.context.fillText(edge.id, center.x - 5, center.y - 2);
    }
  }

  drawPolygons () {
    for (let i = 0; i < this.substrateSystem.polygons.length; i++) {
      let polygon = this.substrateSystem.polygons[i];

      let debugColor = this.getDebugColor(polygon.id, this._cachedVector3);
      this.context.fillStyle = `rgba(${debugColor.x}, ${debugColor.y}, ${debugColor.z}, .5)`;

      this.context.beginPath();
      let vertex = polygon.vertices[0];
      this.context.moveTo(vertex.x, vertex.y);
      for (let i = 1; i < polygon.vertices.length; i++) {
        vertex = polygon.vertices[i];
        this.context.lineTo(vertex.x, vertex.y);
      }

      this.context.fill();
    }
  }

  getDebugColor (id, outVector = new Vector3()) {
    let moduloId = id % 6;
    let r = (moduloId === 1 || moduloId === 4 || moduloId === 6) ? 255 : 0;
    let g = (moduloId === 2 || moduloId === 4 || moduloId === 5) ? 220 : 0;
    let b = (moduloId === 3 || moduloId === 5 || moduloId === 6) ? 255 : 0;
    return outVector.set(r, g, b);
  }
}
