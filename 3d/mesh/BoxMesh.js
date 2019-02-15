// From https://github.com/mrdoob/three.js/blob/master/src/geometries/BoxGeometry.js

export default class BoxMesh {
  constructor({
    width = 1,
    height = 1,
    depth = 1,
    widthSegments = 1,
    heightSegments = 1,
    depthSegments = 1,
    positions = true,
    normals = true,
    uvs = true,
    indices = true,
  }) {
    const indicesArray = [];
    const verticesArray = [];
    const normalsArray = [];
    const uvsArray = [];

    let numberOfVertices = 0;

    buildPlane("z", "y", "x", - 1, - 1, depth, height, width, depthSegments, heightSegments);
    buildPlane("z", "y", "x", 1, - 1, depth, height, - width, depthSegments, heightSegments);
    buildPlane("x", "z", "y", 1, 1, width, depth, height, widthSegments, depthSegments);
    buildPlane("x", "z", "y", 1, - 1, width, depth, - height, widthSegments, depthSegments);
    buildPlane("x", "y", "z", 1, - 1, width, height, depth, widthSegments, heightSegments);
    buildPlane("x", "y", "z", - 1, - 1, width, height, - depth, widthSegments, heightSegments);

    if (positions) {
      this.positions = new Float32Array(verticesArray);
    }

    if (normals) {
      this.normals = new Float32Array(normalsArray);
    }

    if (uvs) {
      this.uvs = new Float32Array(uvsArray);
    }

    if (indices) {
      this.indices = new Uint16Array(indicesArray);
    }

    function buildPlane(u, v, w, udir, vdir, width, height, depth, gridX, gridY, materialIndex) {
      const segmentWidth = width / gridX;
      const segmentHeight = height / gridY;

      const widthHalf = width / 2;
      const heightHalf = height / 2;
      const depthHalf = depth / 2;

      const gridX1 = gridX + 1;
      const gridY1 = gridY + 1;

      let vertexCounter = 0;

      let ix; let iy;

      const vector = {
        x: 0,
        y: 0,
        z: 0,
      };

      for (iy = 0; iy < gridY1; iy++) {
        const y = iy * segmentHeight - heightHalf;

        for (ix = 0; ix < gridX1; ix++) {
          const x = ix * segmentWidth - widthHalf;

          vector[u] = x * udir;
          vector[v] = y * vdir;
          vector[w] = depthHalf;

          if (positions) {
            verticesArray.push(vector.x, vector.y, vector.z);
          }

          vector[u] = 0;
          vector[v] = 0;
          vector[w] = depth > 0 ? 1 : - 1;

          if (normals) {
            normalsArray.push(vector.x, vector.y, vector.z);
          }

          if (uvs) {
            uvsArray.push(ix / gridX);
            uvsArray.push(1 - (iy / gridY));
          }

          vertexCounter += 1;
        }
      }

      if (indices) {
        for (iy = 0; iy < gridY; iy++) {
          for (ix = 0; ix < gridX; ix++) {
            const a = numberOfVertices + ix + gridX1 * iy;
            const b = numberOfVertices + ix + gridX1 * (iy + 1);
            const c = numberOfVertices + (ix + 1) + gridX1 * (iy + 1);
            const d = numberOfVertices + (ix + 1) + gridX1 * iy;

            indicesArray.push(a, b, d);
            indicesArray.push(b, c, d);
          }
        }
      }

      numberOfVertices += vertexCounter;
    }
  }
}
