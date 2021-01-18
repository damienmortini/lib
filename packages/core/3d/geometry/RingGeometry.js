// Similar to https://github.com/mrdoob/three.js/blob/master/src/geometries/RingGeometry.js but with circular uvs

import Vector3 from '../../math/Vector3.js';
import Vector2 from '../../math/Vector2.js';

export default class RingGeometry {
  constructor({
    innerRadius = .5,
    outerRadius = 1,
    thetaSegments = 32,
    phiSegments = 1,
    thetaStart = 0,
    thetaLength = Math.PI * 2,
    positions = true,
    normals = true,
    uvs = true,
    indices = true,
  } = {}) {
    const indicesArray = [];
    const verticesArray = [];
    const normalsArray = [];
    const uvsArray = [];

    let radius = innerRadius;
    const radiusStep = ((outerRadius - innerRadius) / phiSegments);
    const vertex = new Vector3();
    const uv = new Vector2();

    for (let j = 0; j <= phiSegments; j++) {
      for (let i = 0; i <= thetaSegments; i++) {
        const segment = thetaStart + i / thetaSegments * thetaLength;

        vertex.x = radius * Math.cos(segment);
        vertex.y = radius * Math.sin(segment);

        verticesArray.push(vertex.x, vertex.y, vertex.z);

        normalsArray.push(0, 0, 1);

        uv.x = i / thetaSegments;
        uv.y = j / phiSegments;

        uvsArray.push(uv.x, uv.y);
      }
      radius += radiusStep;
    }

    for (let j = 0; j < phiSegments; j++) {
      const thetaSegmentLevel = j * (thetaSegments + 1);

      for (let i = 0; i < thetaSegments; i++) {
        const segment = i + thetaSegmentLevel;

        const a = segment;
        const b = segment + thetaSegments + 1;
        const c = segment + thetaSegments + 2;
        const d = segment + 1;

        indicesArray.push(a, b, d);
        indicesArray.push(b, c, d);
      }
    }

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
      if (indicesArray.length > 65536) {
        this.indices = new Uint32Array(indicesArray);
      } else if (indicesArray.length > 256) {
        this.indices = new Uint16Array(indicesArray);
      } else {
        this.indices = new Uint8Array(indicesArray);
      }
    }
  }
}
