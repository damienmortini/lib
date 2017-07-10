import Vector3 from "./Vector3.js";

const vector3 = new Vector3();
const previousPosition = new Vector3();
const nextPosition = new Vector3();
const tangent = new Vector3();
const normal = new Vector3();
const binormal = new Vector3();

export default class FrenetSerretFrame {
  static compute({
    positions,
    normals = new Float32Array(positions.length),
    range = [0, positions.length - 1]
  }) {
    let length = positions.length / 3;
    let start = range[0];
    let end = range[1];
    for (let i = start; i <= end; i++) {
      const previousPositionId = i === 0 ? i : i - 1;
      previousPosition.set(
        positions[previousPositionId * 3],
        positions[previousPositionId * 3 + 1],
        positions[previousPositionId * 3 + 2]
      );

      const nextPositionId = i === length - 1 ? i : i + 1;
      nextPosition.set(
        positions[nextPositionId * 3],
        positions[nextPositionId * 3 + 1],
        positions[nextPositionId * 3 + 2]
      );

      tangent.copy(nextPosition).subtract(previousPosition);
      if (!(tangent.x + tangent.y + tangent.z)) {
        tangent.set(0, 1, 0);
      }
      tangent.normalize();
      
      if (i === start) {
        if (normals[i * 3] + normals[i * 3 + 1] + normals[i * 3 + 2]) {
          normal.set(
            normals[i * 3],
            normals[i * 3 + 1],
            normals[i * 3 + 2]
          );
        } else {
          vector3.copy(tangent);
          [vector3.x, vector3.y, vector3.z] = [vector3.z, vector3.x, vector3.y];
          normal.cross(tangent, vector3).normalize();
        }
      } else {
        normal.cross(tangent, binormal);
      }

      binormal.cross(normal, tangent).normalize();
      
      normals[i * 3] = normal.x;
      normals[i * 3 + 1] = normal.y;
      normals[i * 3 + 2] = normal.z;
    }
  }
}