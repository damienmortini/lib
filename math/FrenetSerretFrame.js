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
      const previousPoint = i === 0 ? points[i] : points[i - 1];
      const nextPoint = i === points.length - 1 ? points[i] : points[i + 1];
      const pointNormal = normals[i];

      tangent.copy(nextPoint).subtract(previousPoint);
      if (!(tangent[0] + tangent[1] + tangent[2])) {
        tangent.set(0, 1, 0);
      }
      tangent.normalize();

      
      if (i === 0) {
        if (pointNormal[0] + pointNormal[1] + pointNormal[2]) {
          normal.copy(normals[0]);
        } else {
          vector3.copy(tangent);
          [vector3[0], vector3[1], vector3[2]] = [vector3[2], vector3[0], vector3[1]];
          normal.cross(tangent, vector3).normalize();
        }
      } else {
        normal.cross(tangent, binormal);
      }

      binormal.cross(normal, tangent);
      
      pointNormal[0] = normal[0];
      pointNormal[1] = normal[1];
      pointNormal[2] = normal[2];
    }
  }
}