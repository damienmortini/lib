import GridMesh from "grid-mesh";

export default class PlaneMesh {
  constructor({width = 1, height = 1, columns = 1, rows = 1} = {}) {
    let gridMesh = new GridMesh(columns - 1, rows - 1, [-width * .5, -height * .5], [width / (columns - 1), 0], [0, height / (rows - 1)]);

    this.vertices = new Float32Array(gridMesh.positions.length * 3);
    this.uvs = new Float32Array(gridMesh.positions.length * 2);

    for (let i = 0; i < gridMesh.positions.length; i++) {
      let x = gridMesh.positions[i][0];
      let y = gridMesh.positions[i][1];

      this.vertices[i * 3] = x;
      this.vertices[i * 3 + 1] = y;

      this.uvs[i * 2] = x / width + .5;
      this.uvs[i * 2 + 1] = y / height + .5;
    }

    this.indices = new Uint16Array(gridMesh.cells.length * 3);
    
    for (let i = 0; i < gridMesh.cells.length; i++) {
      this.indices[i * 3] = gridMesh.cells[i][0];
      this.indices[i * 3 + 1] = gridMesh.cells[i][1];
      this.indices[i * 3 + 2] = gridMesh.cells[i][2];
    }
  }
}