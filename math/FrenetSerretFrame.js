import Vector3 from "./Vector3.js";

const vector3 = new Vector3();
const tangent = new Vector3();
const normal = new Vector3();
const binormal = new Vector3();

export default class FrenetSerretFrame {
  static compute({
    points,
    normals = new Array(points.length).fill().map(() => new Vector3())
  }) {
    for (let i = 0; i < points.length; i++) {
      let previousPoint = i === 0 ? points[i] : points[i - 1];
      let nextPoint = i === points.length - 1 ? points[i] : points[i + 1];

      tangent.copy(nextPoint).subtract(previousPoint);
      if (!tangent.size) {
        tangent.set(0, 1, 0);
      }
      tangent.normalize();

      if (i === 0) {
        if (normals[0].size) {
          normal.copy(normals[0]);
        } else {
          vector3.copy(tangent);
          [vector3.x, vector3.y, vector3.z] = [vector3.z, vector3.x, vector3.y];
          normal.cross(tangent, vector3).normalize();
        }
      } else {
        normal.cross(tangent, binormal).normalize();
      }

      binormal.cross(normal, tangent).normalize();
      
      normals[i].copy(normal);
    }
  }
}