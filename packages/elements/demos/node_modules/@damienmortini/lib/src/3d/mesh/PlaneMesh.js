export default class PlaneMesh {
  constructor({
    width = 1,
    height = 1,
    columns = 1,
    rows = 1,
    positions = true,
    normals = true,
    uvs = true,
    indices = true,
  } = {}) {
    const xSegments = columns + 1;
    const ySegments = rows + 1;

    if (positions) {
      this.positions = new Float32Array((columns + 1) * (rows + 1) * 3);
    }

    if (normals) {
      this.normals = new Float32Array((columns + 1) * (rows + 1) * 3);
    }

    if (uvs) {
      this.uvs = new Float32Array((columns + 1) * (rows + 1) * 2);
    }

    for (let j = 0; j < ySegments; j++) {
      const v = 1 - j / rows;
      const y = j / rows * height - height * .5;

      for (let i = 0; i < xSegments; i++) {
        const u = i / columns;

        const offset = j * xSegments + i;

        if (positions) {
          this.positions[offset * 3] = u * width - width * .5;
          this.positions[offset * 3 + 1] = y;
        }

        if (normals) {
          this.normals[offset * 3 + 2] = 1;
        }

        if (uvs) {
          this.uvs[offset * 2] = u;
          this.uvs[offset * 2 + 1] = 1 - v;
        }
      }
    }

    if (indices) {
      this.indices = new Uint16Array(columns * rows * 6);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          const a = i + xSegments * j;
          const b = i + xSegments * (j + 1);
          const c = (i + 1) + xSegments * (j + 1);
          const d = (i + 1) + xSegments * j;

          const offset = j * rows + i;

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
