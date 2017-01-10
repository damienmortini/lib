import { Mesh, BufferAttribute, CylinderBufferGeometry, Vector3 } from "three";

import THREEShaderMaterial from "./THREEShaderMaterial.js";

export default class THREELine extends Mesh {
  constructor({
    points,
    material = new THREEShaderMaterial(),
    detail = 3,
    thickness = .1
  } = {}) {
    super(new CylinderBufferGeometry(1, 1, points.length - 1, detail, points.length - 1), material);

    this.points = points;
    this.frustumCulled = false;

    this._vector3 = new Vector3();
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

    this.geometry.addAttribute("linePointId", new BufferAttribute(ids, 1));

    material.add({
      uniforms: {
        linePositions: this.points,
        lineThickness: thickness
      },
      vertexShaderChunks: [
        ["start", `
          uniform float lineThickness;
          uniform vec3 linePositions[${this.points.length}];
          uniform vec3 lineNormals[${this.points.length}];

          attribute float linePointId;
        `],
        ["main", `
          vec3 linePositionOffset = position;

          vec3 position = linePositions[int(linePointId)];
          vec3 normal = lineNormals[int(linePointId)];

          vec3 lineDirection = normalize(mix(position - linePositions[int(linePointId) - 1], linePositions[int(linePointId) + 1] - position, step(1., ${this.points.length - 1}. - linePointId)));

          normal = normal * linePositionOffset.x + cross(normal, lineDirection) * linePositionOffset.z;

          position += normal * lineThickness;
        `]
      ]
    });

    this.update();
  }

  set thickness(value) {
    this.material.lineThickness = value;
  }

  get thickness() {
    return this.material.lineThickness;
  }

  update() {
    for (let i = 0; i < this.points.length; i++) {
      if(i === this.points.length - 1) {
        continue;
      }

      let point = this.points[i];
      let nextPoint = this.points[i + 1];

      this._tangent.copy(nextPoint).sub(point).normalize();

      if (i === 0) {
        this._vector3.copy(point).add(nextPoint);
        this._vector3.normalize();
        [this._vector3.x, this._vector3.y, this._vector3.z] = [this._vector3.z, this._vector3.x, this._vector3.y];
        this._normal.crossVectors(this._tangent, this._vector3).normalize();
      } else {
        this._normal.crossVectors(this._tangent, this._binormal).normalize();
      }

      this._binormal.crossVectors(this._normal, this._tangent).normalize();

      this.material.lineNormals[i].copy(this._normal);
      if (i === this.points.length - 2) {
        this.material.lineNormals[i + 1].copy(this._normal);
      }
    }
  }
}
