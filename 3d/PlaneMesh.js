export default class PlaneMesh {
  constructor({
    width = 1, 
    height = 1, 
    columns = 1, 
    rows = 1,
    position = true,
    normal = true,
    uv = true,
    indexed = true
  } = {}) {
    let xSegments = columns + 1;
    let ySegments = rows + 1;

    let verticesNumber = xSegments * ySegments;

    this.attributes = new Map();
    
    let positions;
    let normals;
    let uvs;

    if(position) {
      positions = new Float32Array(verticesNumber * 3);
      this.attributes.set("position", {
        data: positions,
        size: 3
      });
    }
    
    if(normal) {
      normals = new Float32Array(verticesNumber * 3);
      this.attributes.set("normal", {
        data: normals,
        size: 3
      });
    }
    
    if(uv) {
      uvs = new Float32Array(verticesNumber * 2);
      this.attributes.set("uv", {
        data: uvs,
        size: 2
      });
    }

    for (let j = 0; j < ySegments; j++) {
      let v = 1 - j / rows;
      let y = j / rows * height - height * .5;

      for (let i = 0; i < xSegments; i++) {
        let u = i / columns;

        let offset = j * xSegments + i;

        if(position) {
          positions[offset * 3] = u * width - width * .5;
          positions[offset * 3 + 1] = y;
        }

        if(normal) {
          normals[offset * 3 + 2] = 1;
        }

        if(uv) {
          uvs[offset * 2] = u;
          uvs[offset * 2 + 1] = 1 - v;
        }
      }
    }

    if(indexed) {
      const indices = new Uint16Array(columns * rows * 6);    
      this.indices = {
        data: indices
      };

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          var a = i + xSegments * j;
          var b = i + xSegments * (j + 1);
          var c = (i + 1) + xSegments * (j + 1);
          var d = (i + 1) + xSegments * j;
  
          let offset = j * rows + i;
  
          indices[offset * 6] = a;
          indices[offset * 6 + 1] = d;
          indices[offset * 6 + 2] = b;
          indices[offset * 6 + 3] = b;
          indices[offset * 6 + 4] = d;
          indices[offset * 6 + 5] = c;
        }
      }
    }
    
  }
}