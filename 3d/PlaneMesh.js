export default class PlaneMesh {
  constructor({
    width = 1, 
    height = 1, 
    columns = 1, 
    rows = 1,
    positions = undefined,
    normals = undefined,
    uvs = undefined,
    indices = undefined
  } = {}) {
    let xSegments = columns + 1;
    let ySegments = rows + 1;

    let verticesNumber = xSegments * ySegments;
    
    this.positions = positions === undefined ? new Float32Array(verticesNumber * 3) : positions;
    this.normals = normals === undefined ? new Float32Array(verticesNumber * 3) : normals;
    this.uvs = uvs === undefined ? new Float32Array(verticesNumber * 2) : uvs;
    this.indices = indices === undefined ? new Uint16Array(columns * rows * 6) : indices;

    this.attributes = new Map();

    if(this.positions) {
      this.attributes.set("position", {
        data: this.positions,
        size: 3
      });
    }
    
    if(this.normals) {
      this.attributes.set("normal", {
        data: this.normals,
        size: 3
      });
    }
    
    if(this.uvs) {
      this.attributes.set("uv", {
        data: this.uvs,
        size: 2
      });
    }

    for (let j = 0; j < ySegments; j++) {
      let v = 1 - j / rows;
      let y = j / rows * height - height * .5;

      for (let i = 0; i < xSegments; i++) {
        let u = i / columns;

        let offset = j * xSegments + i;

        if(this.positions) {
          this.positions[offset * 3] = u * width - width * .5;
          this.positions[offset * 3 + 1] = y;
        }

        if(this.normals) {
          this.normals[offset * 3 + 2] = 1;
        }

        if(this.uvs) {
          this.uvs[offset * 2] = u;
          this.uvs[offset * 2 + 1] = 1 - v;
        }
      }
    }

    if(this.indices) {
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          var a = i + xSegments * j;
          var b = i + xSegments * (j + 1);
          var c = (i + 1) + xSegments * (j + 1);
          var d = (i + 1) + xSegments * j;
  
          let offset = j * rows + i;
  
          this.indices[offset * 6] = a;
          this.indices[offset * 6 + 1] = d;
          this.indices[offset * 6 + 2] = b;
          this.indices[offset * 6 + 3] = b;
          this.indices[offset * 6 + 4] = d;
          this.indices[offset * 6 + 5] = c;
        }
      }
    }
  }
}