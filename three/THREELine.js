import { Mesh, BufferAttribute, CylinderBufferGeometry, Vector3 } from "three";

import DVector3 from "../math/Vector3.js";

import FrenetSerretFrame from "../math/FrenetSerretFrame.js";

import THREEShaderMaterial from "./THREEShaderMaterial.js";

export default class THREELine extends Mesh {
  constructor({
    points = [new Vector3(0, -1, 0), new Vector3(0, 1, 0)],
    material = new THREEShaderMaterial(),
    detail = 3,
    thickness = .1,
    geometry = new CylinderBufferGeometry(1, 1, points.length - 1, detail, points.length - 1)
  } = {}) {
    super(geometry, material);

    this.points = points;
    this._pointsArray = new Array(this.points.length).fill().map(() => new DVector3());
    this._normalsArray = new Array(this.points.length).fill().map(() => new DVector3());
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
      uniforms: [
        ["linePositions", this.points],
        ["lineThickness", thickness]
      ],
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

          vec3 lineDirection = normalize(linePositions[int(linePointId) + 1] - position);
          lineDirection = mix(normalize(position - linePositions[int(linePointId) - 1]), lineDirection, length(lineDirection));

          normal = normal * linePositionOffset.x + cross(normal, lineDirection) * linePositionOffset.z;

          position += normal * lineThickness;
        `]
      ]
    });

    this.update();
  }

  set normals(value) {
    this.material.lineNormals = value;
  }

  get normals() {
    return this.material.lineNormals;
  }

  set thickness(value) {
    this.material.lineThickness = value;
  }

  get thickness() {
    return this.material.lineThickness;
  }

  update() {
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      const pointArray = this._pointsArray[i];
      pointArray.x = point.x;
      pointArray.y = point.y;
      pointArray.z = point.z;
      const normal = this.normals[i];
      const normalArray = this._normalsArray[i];
      normalArray.x = normal.x;
      normalArray.y = normal.y;
      normalArray.z = normal.z;
    }

    FrenetSerretFrame.compute({
      points: this._pointsArray,
      normals: this._normalsArray
    });

    for (let i = 0; i < this.points.length; i++) {
      const normal = this.normals[i];
      const normalArray = this._normalsArray[i];
      normal.x = normalArray.x;
      normal.y = normalArray.y;
      normal.z = normalArray.z;
    }
  }
}
