export class PlaneGeometry {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint8Array | Uint16Array | Uint32Array;

  constructor({
    width = 1,
    height = 1,
    columns = 1,
    rows = 1,
    positions = true,
    normals = true,
    uvs = true,
    indices = true,
    facingUp = false,
  } = {}) {
    const xSegments = columns + 1;
    const ySegments = rows + 1;

    this.positions = positions ? new Float32Array((columns + 1) * (rows + 1) * 3) : null;
    this.normals = normals ? new Float32Array((columns + 1) * (rows + 1) * 3) : null;
    this.uvs = uvs ? new Float32Array((columns + 1) * (rows + 1) * 2) : null;

    for (let j = 0; j < ySegments; j++) {
      const v = 1 - j / rows;
      const y = ((j / rows) * height - height * 0.5) * (facingUp ? -1 : 1);

      for (let i = 0; i < xSegments; i++) {
        const u = i / columns;

        const offset = j * xSegments + i;

        const yIndex = facingUp ? 2 : 1;
        if (positions) {
          this.positions[offset * 3] = u * width - width * 0.5;
          this.positions[offset * 3 + yIndex] = y;
        }

        const upIndex = facingUp ? 1 : 2;
        if (normals) {
          this.normals[offset * 3 + upIndex] = 1;
        }

        if (uvs) {
          this.uvs[offset * 2] = u;
          this.uvs[offset * 2 + 1] = 1 - v;
        }
      }
    }

    if (indices) {
      const length = columns * rows * 6;
      if (length < 2 ** 16) this.indices = new Uint16Array(length);
      else this.indices = new Uint32Array(length);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          const a = i + xSegments * j;
          const b = i + xSegments * (j + 1);
          const c = i + 1 + xSegments * (j + 1);
          const d = i + 1 + xSegments * j;

          const offset = j * columns + i;

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
