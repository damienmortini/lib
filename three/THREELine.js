import { Mesh, Geometry, BufferAttribute, CylinderBufferGeometry, Vector3, Matrix4, Quaternion, AxisHelper } from "three";

import THREEShaderMaterial from "./THREEShaderMaterial.js";

const LEFT = new Vector3(-1, 0, 0);

const DEBUG = false;

export default class THREELine extends Mesh {
  constructor({
    points,
    material = new THREEShaderMaterial({type : "normal"}),
    detail = 3,
    thickness = .1
  } = {}) {
    super(new CylinderBufferGeometry(1, 1, points.length - 1, detail, points.length - 1), material);

    // material.wireframe = true;

    this.points = points;
    this.frustumCulled = false;

    this._vector3 = new Vector3();
    this._matrix4 = new Matrix4();
    this._tangent = new Vector3();
    this._normal = new Vector3();
    this._binormal = new Vector3();

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
          uniform vec3 normals[${this.points.length}];

          attribute float id;
        `],
        ["main", `
          vec3 position = position;
          vec3 offset = position;

          position = positions[int(id)];

          vec3 direction = normalize(mix(position - positions[int(id) - 1], positions[int(id) + 1] - position, step(1., ${this.points.length - 1}. - id)));

          vec3 normal = normals[int(id)];

          vec3 binormal = cross(normal, direction);

          normal = normal * offset.x + binormal * offset.z;
          // normal = normalize(normal);

          // normal = normals[int(id)];

          position += normal * thickness;
        `]
      ]
    });

    if(DEBUG) {
      this._axisHelpers = [];
      for (let i = 0; i < this.points.length - 1; i++) {
        let axisHelper = new AxisHelper(.2);
        axisHelper.matrixAutoUpdate = false;
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
        this._normal.crossVectors(this._tangent, this._vector3).normalize();
      } else {
        this._normal.crossVectors(this._tangent, this._binormal).normalize();
      }

      this._binormal.crossVectors(this._normal, this._tangent).normalize();

      this.material.normals[i].copy(this._normal);
      if (i === this.points.length - 2) {
        this.material.normals[i + 1].copy(this._normal);
      }

      if(DEBUG) {
        this._axisHelpers[i].matrix.set(
          this._normal.x,
          this._tangent.x,
          this._binormal.x,
          point.x,

          this._normal.y,
          this._tangent.y,
          this._binormal.y,
          point.y,

          this._normal.z,
          this._tangent.z,
          this._binormal.z,
          point.z,

          0,
          0,
          0,
          1
        );
      }
    }
  }
}
