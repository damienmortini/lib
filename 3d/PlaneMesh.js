export default class PlaneMesh {
  constructor({width = 1, height = 1, columns = 1, rows = 1} = {}) {
    let xSegments = columns + 1;
    let ySegments = rows + 1;

    let verticesNumber = xSegments * ySegments;

    this.positions = new Float32Array(verticesNumber * 3);
    this.normals = new Float32Array(verticesNumber * 3);
    this.uvs = new Float32Array(verticesNumber * 2);

    for (let j = 0; j < ySegments; j++) {
      let v = 1 - j / rows;
      let y = j / rows * height - height * .5;

      for (let i = 0; i < xSegments; i++) {
        let u = i / columns;

        let offset = j * xSegments + i;

        this.positions[offset * 3] = u * width - width * .5;
        this.positions[offset * 3 + 1] = y;

        this.normals[offset * 3 + 2] = 1;

        this.uvs[offset * 2] = u;
        this.uvs[offset * 2 + 1] = v;
      }
    }

    this.indices = new Uint16Array(columns * rows * 6);
    
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < columns; i++) {
        var a = i + xSegments * j;
        var b = i + xSegments * (j + 1);
        var c = (i + 1) + xSegments * (j + 1);
        var d = (i + 1) + xSegments * j;

        let offset = j * rows + i;

        this.indices[offset * 6] = a;
        this.indices[offset * 6 + 1] = b;
        this.indices[offset * 6 + 2] = d;
        this.indices[offset * 6 + 3] = b;
        this.indices[offset * 6 + 4] = c;
        this.indices[offset * 6 + 5] = d;
      }
    }
  }
}