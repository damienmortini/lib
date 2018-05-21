export default class PlaneMesh {
  constructor({
    width = 1,
    height = 1,
    columns = 1,
    rows = 1,
    positions = true,
    normals = undefined,
    uvs = undefined,
    indices = true
  } = {}) {
    let xSegments = columns + 1;
    let ySegments = rows + 1;

    let verticesNumber = xSegments * ySegments;

    positions = positions === true ? new Float32Array(verticesNumber * 3) : positions;
    normals = normals === true ? new Float32Array(verticesNumber * 3) : normals;
    uvs = uvs === true ? new Float32Array(verticesNumber * 2) : uvs;

    this.attributes = new Map();

    if (positions) {
      this.attributes.set("position", {
        data: positions,
        size: 3
      });
    }

    if (normals) {
      this.attributes.set("normal", {
        data: normals,
        size: 3
      });
    }

    if (uvs) {
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

        if (positions) {
          positions[offset * 3] = u * width - width * .5;
          positions[offset * 3 + 1] = y;
        }

        if (normals) {
          normals[offset * 3 + 2] = 1;
        }

        if (uvs) {
          uvs[offset * 2] = u;
          uvs[offset * 2 + 1] = 1 - v;
        }
      }
    }

    if (indices) {
      this.indices = indices === true ? new Uint16Array(columns * rows * 6) : indices;

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