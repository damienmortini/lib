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

    this.userData._thickness = thickness;
    this.userData._lineNormals = new Float32Array(this.points.length * 3);
    this.userData._linePositions = new Float32Array(this.points.length * 3);

    this.frustumCulled = false;

    let positions = this.geometry.getAttribute("position").array;
    let verticesNumber = positions.length / 3;
    let ids = new Float32Array(verticesNumber);
    let offsetY = (points.length - 1) / 2;
    for (let i = 0; i < verticesNumber; i++) {
      ids[i] = positions[i * 3 + 1] + offsetY;
    }

    this.geometry.addAttribute("linePointId", new BufferAttribute(ids, 1));

    if(!material.linePositions) {
      material.add({
        uniforms: [
          ["linePositions", this.userData._linePositions],
          ["lineThickness", this.userData._thickness],
          ["lineNormals", this.userData._lineNormals]
        ],
        vertexShaderChunks: [
          ["start", `
            uniform float lineThickness;
            uniform vec3 linePositions[${this.points.length}];
            uniform vec3 lineNormals[${this.points.length}];

            attribute float linePointId;
          `],
          ["main", `
            vec3 position = position;

            vec3 linePosition = linePositions[int(linePointId)];
            vec3 lineDirection = normalize(linePositions[int(linePointId) + 1] - linePosition);
            lineDirection = mix(normalize(linePosition - linePositions[int(linePointId) - 1]), lineDirection, length(lineDirection));
            vec3 lineNormal = lineNormals[int(linePointId)];

            vec3 normal = lineNormal * position.x + cross(lineNormal, lineDirection) * position.z;

            position = linePosition + normal * lineThickness;
          `]
        ]
      });
    }

    this.update();
  }

  onBeforeRender(renderer, scene, camera, geometry, material, group) {
    const threeProgram = renderer.properties.get(material).program;
    if(!threeProgram) {
      return;
    }
    const gl = renderer.getContext();
    const uniforms = threeProgram.getUniforms();

    gl.useProgram(threeProgram.program);
    uniforms.setValue(gl, "lineThickness", this.userData._thickness);
    uniforms.setValue(gl, "lineNormals", this.userData._lineNormals);
    uniforms.setValue(gl, "linePositions", this.userData._linePositions);
  }

  set thickness(value) {
    this.userData._thickness = value;
  }

  get thickness() {
    return this.userData._thickness;
  }

  update({
    range = [0, this.points.length - 1]
  } = {}) {
    const end = range[1];
    for (let i = range[0]; i <= end; i++) {
      const point = this.points[i];
      this.userData._linePositions[i * 3] = point.x;
      this.userData._linePositions[i * 3 + 1] = point.y;
      this.userData._linePositions[i * 3 + 2] = point.z;
    }

    FrenetSerretFrame.compute({
      positions: this.userData._linePositions,
      normals: this.userData._lineNormals,
      range
    });
  }
}
