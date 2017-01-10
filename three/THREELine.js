import { Mesh, Geometry, BufferAttribute, CylinderBufferGeometry, Vector3, Matrix4, Quaternion, AxisHelper } from "three";

import THREEShaderMaterial from "./THREEShaderMaterial.js";

const LEFT = new Vector3(-1, 0, 0);

const DEBUG = true;

export default class THREELine extends Mesh {
  constructor({
    points,
    material = new THREEShaderMaterial({type: "normal"}),
    detail = 3,
    thickness = .1
  } = {}) {
    super(new CylinderBufferGeometry(1, 1, points.length - 1, detail, points.length - 1), material);

    // material.wireframe = true;

    this.points = points;
    this.frustumCulled = false;

    this._tangent = new Vector3();
    this._quaternion = new Quaternion();
    this._vector3 = new Vector3();
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
          uniform vec3 binormals[${this.points.length}];
          uniform vec3 normals[${this.points.length}];

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

          vec3 rotate_vector( vec4 q, vec3 vec ) {

            float x = vec.x, y = vec.y, z = vec.z;
        		float qx = q.x, qy = q.y, qz = q.z, qw = q.w;

        		// calculate quat * vector

        		float ix =  qw * x + qy * z - qz * y;
        		float iy =  qw * y + qz * x - qx * z;
        		float iz =  qw * z + qx * y - qy * x;
        		float iw = - qx * x - qy * y - qz * z;

        		// calculate result * inverse quat

        		vec.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
        		vec.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
        		vec.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

            return vec;
            // return vec + 2.0 * cross( cross( vec, quat.xyz ) + quat.w * vec, quat.xyz );
          }
        `],
        ["main", `
          /// GLSL only

          // vec3 offset = vec3(position.x, 0., position.z);
          // vec3 position = positions[int(id)];
          // vec3 nextPosition = positions[int(id + 1.)];
          // vec3 ref = normalize(positions[1] - positions[0]);
          // ref = ref.zxy;
          // vec3 T = normalize(nextPosition - position);
          // vec3 B = normalize(cross(T, ref));
          // vec3 N = normalize(cross(B, T));
          // vec3 normal = B * offset.x + N * offset.z;
          // position = position + normal * thickness;

          /// GLSL only

          // mat3 rotationMatrix = matrixFromEuler(rotations[int(id)]);
          // position *= rotationMatrix;


          vec3 position = position;
          vec3 offset = vec3(position.x, 0., position.z);
          vec3 normal = binormals[int(id)] * offset.x + normals[int(id)] * offset.z;
          // normal.y = 0.;
          position = positions[int(id)] + normal * thickness;

          // position = offset * thickness;

          // position = rotate_vector(rotations[int(id)], position);

          // position += positions[int(id)];
        `]
      ]
    });

    if(DEBUG) {
      this._axisHelpers = [];
      for (let i = 0; i < this.points.length - 1; i++) {
        let axisHelper = new AxisHelper(1);
        this.add(axisHelper);
        this._axisHelpers.push(axisHelper);
      }
    }

    this.update();
  }

  update() {
    for (let [i, point] of this.points.entries()) {
      if(i === this.points.length - 1) {
        continue;
      }

      this._tangent.copy(this.points[i + 1]).sub(point).normalize();

      if (i === 0) {
        this._vector3.copy(this.points[i + 1]).add(point);
        this._vector3.normalize();
        [this._vector3.x, this._vector3.y, this._vector3.z] = [this._vector3.z, this._vector3.x, this._vector3.y];
        this._binormal.crossVectors(this._tangent, this._vector3).normalize();
      } else {
        this._binormal.crossVectors(this._tangent, this._previousNormal).normalize();
      }

      this._normal.crossVectors(this._binormal, this._tangent).normalize();

      this._matrix4.set(
        this._binormal.x,
        this._tangent.x,
        this._normal.x,
        point.x,

        this._binormal.y,
        this._tangent.y,
        this._normal.y,
        point.y,

        this._binormal.z,
        this._tangent.z,
        this._normal.z,
        point.z,

        0,
        0,
        0,
        1
      );

      this._quaternion.setFromRotationMatrix(this._matrix4);

      this.material.normals[i] = this._normal;
      this.material.binormals[i] = this._binormal;
      if (i === this.points.length - 2) {
        this.material.normals[i + 1] = this._normal;
        this.material.binormals[i + 1] = this._binormal;
      }

      if(DEBUG) {
        this._axisHelpers[i].matrixAutoUpdate = false;
        this._axisHelpers[i].matrix.copy(this._matrix4);
      }

      this._previousNormal.copy(this._normal);
    }
  }
}
