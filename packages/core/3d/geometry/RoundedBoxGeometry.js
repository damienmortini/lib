// Adapted from Marcin Ignac https://github.com/vorg/primitive-rounded-cube

import BoxGeometry from './BoxGeometry.js';
import Vector3 from '../../math/Vector3.js';

const VECTOR3 = new Vector3();

export default class RoundedBoxGeometry extends BoxGeometry {
  constructor({
    width = 1,
    height = 1,
    depth = 1,
    widthSegments = 10,
    heightSegments = 10,
    depthSegments = 10,
    radius = .25,
    radiusWidth = radius,
    radiusHeight = radius,
    radiusDepth = radius,
    positions = true,
    normals = true,
    uvs = true,
    indices = true,
  } = {}) {
    super({
      width,
      height,
      depth,
      widthSegments,
      heightSegments,
      depthSegments,
      positions,
      normals,
      uvs,
      indices,
    });

    const position = new Vector3();

    const VERTICES_NUMBER = this.positions.length / 3;
    for (let index = 0; index < VERTICES_NUMBER; index++) {
      position.set(this.positions[index * 3], this.positions[index * 3 + 1], this.positions[index * 3 + 2]);
      VECTOR3.copy(position);

      if (position.x < -width * .5 + radiusWidth) {
        position.x = -width * .5 + radiusWidth;
      } else if (position.x > width * .5 - radiusWidth) {
        position.x = width * .5 - radiusWidth;
      }

      if (position.y < -height * .5 + radiusHeight) {
        position.y = -height * .5 + radiusHeight;
      } else if (position.y > height * .5 - radiusHeight) {
        position.y = height * .5 - radiusHeight;
      }

      if (position.z < -depth * .5 + radiusDepth) {
        position.z = -depth * .5 + radiusDepth;
      } else if (position.z > depth * .5 - radiusDepth) {
        position.z = depth * .5 - radiusDepth;
      }

      VECTOR3.subtract(position).normalize();

      position.x += VECTOR3.x * radiusWidth;
      position.y += VECTOR3.y * radiusHeight;
      position.z += VECTOR3.z * radiusDepth;

      this.positions[index * 3] = position.x;
      this.positions[index * 3 + 1] = position.y;
      this.positions[index * 3 + 2] = position.z;

      if (this.normals) {
        this.normals[index * 3] = VECTOR3.x;
        this.normals[index * 3 + 1] = VECTOR3.y;
        this.normals[index * 3 + 2] = VECTOR3.z;
      }
    }
  }
}
