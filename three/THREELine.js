import { Mesh, Geometry, BufferAttribute, CylinderBufferGeometry, Vector3, Matrix4, Quaternion } from "three";

import THREEShaderMaterial from "./THREEShaderMaterial.js";

const LEFT = new Vector3(-1, 0, 0);

export default class THREELine extends Mesh {
  constructor({
    points,
    material = new THREEShaderMaterial(),
    detail = 3,
    thickness = .1
  } = {}) {
    super(new CylinderBufferGeometry(1, 1, points.length - 1, detail, points.length - 1), material);

    material.wireframe = true;

    this.points = points;
    this.frustumCulled = false;

    this._direction = new Vector3();
    this._quaternion = new Quaternion();
    this._normal = new Vector3();
    this._binormal = new Vector3();
    this._previousNormal = new Vector3();
    this._matrix4 = new Matrix4();

    let positions = this.geometry.getAttribute("position").array;
    let verticesNumber = positions.length / 3;
    let ids = new Float32Array(verticesNumber);
    let offsetY = (points.length - 1) / 2;
    for (let i = 0; i < verticesNumber; i++) {
      ids[i] = positions[i * 3 + 1] + offsetY;
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    this.geometry.addAttribute("id", new BufferAttribute(ids, 1));

    material.add({
      uniforms: {
        positions: this.points,
        thickness
      },
      vertexShaderChunks: [
        ["start", `
          uniform float thickness;
          uniform vec3 positions[${this.points.length}];
          uniform vec4 rotations[${this.points.length}];

          attribute float id;

          mat3 matrixFromEuler(vec3 euler) {
            mat3 m;

            float a = cos(euler.x);
            float b = sin(euler.x);
            float c = cos(euler.y);
            float d = sin(euler.y);
            float e = cos(euler.z);
            float f = sin(euler.z);

            float ae = a * e;
            float af = a * f;
            float be = b * e;
            float bf = b * f;

            m[0][0] = c * e;
            m[0][1] = - c * f;
            m[0][2] = d;

            m[1][0] = af + be * d;
            m[1][1] = ae - bf * d;
            m[1][2] = - b * c;

            m[2][0] = bf - ae * d;
            m[2][1] = be + af * d;
            m[2][2] = a * c;

            return m;
          }

          vec3 rotate_vector( vec4 quat, vec3 vec ) {
            return vec + 2.0 * cross( cross( vec, quat.xyz ) + quat.w * vec, quat.xyz );
          }
        `],
        ["main", `
          vec3 position = position;
          position += normal * thickness;

          // mat3 rotationMatrix = matrixFromEuler(rotations[int(id)]);
          // position *= rotationMatrix;

          position = rotate_vector(rotations[int(id)], position);

          position += positions[int(id)];
        `]
      ]
    });

    this.update();
  }

  update() {
    for (let [i, point] of this.points.entries()) {
      if(i === 0) {
        continue;
      }

      this._direction.copy(point).sub(this.points[i - 1]).normalize();

      if (i === 1) {
        this._binormal.crossVectors(LEFT, this._direction).normalize();
      } else {
        this._binormal.crossVectors(this._previousNormal, this._direction).normalize();
      }

      this._normal.crossVectors(this._direction, this._binormal).normalize();

      this._matrix4.set(
        this._normal.x,
        this._direction.x,
        this._binormal.x,
        0,

        this._normal.y,
        this._direction.y,
        this._binormal.y,
        0,

        this._normal.z,
        this._direction.z,
        this._binormal.z,
        0,

        0,
        0,
        0,
        1
      );

      // this._matrix4.set(
      //   1,
      //   0,
      //   0,
      //   0,
      //
      //   0,
      //   1,
      //   0,
      //   0,
      //
      //   0,
      //   0,
      //   1,
      //   0,
      //
      //   0,
      //   0,
      //   0,
      //   1
      // );

      this._quaternion.setFromRotationMatrix(this._matrix4);
      this._quaternion.normalize();
      // this._quaternion.z *= -1;

      // this._euler = new Euler(Math.PI * .5, 0, 0);
      // this._euler = new Euler(0, 0, 0);

      // this._quaternion = new Quaternion();
      // this._quaternion.setFromEuler(new Euler(0, 0, Math.PI * .25));

      this.material.rotations[i] = this._quaternion;
      if (i === 1) {
        this.material.rotations[i - 1] = this._quaternion;
      }

      this._previousNormal.copy(this._normal);
    }
  }
}
