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

    this.userData.thickness = thickness;
    this.userData._lineNormals = new Float32Array(100 * 3);

    this.points = points;
    this.normals = new Array(this.points.length).fill().map(() => new Vector3());

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

    if(!material.linePositions) {
      material.add({
        uniforms: [
          ["linePositions", this.points],
          ["lineThickness", this.userData.thickness],
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
            vec3 linePositionOffset = position;

            vec3 position = linePositions[int(linePointId)];
            vec3 lineDirection = normalize(linePositions[int(linePointId) + 1] - position);
            lineDirection = mix(normalize(position - linePositions[int(linePointId) - 1]), lineDirection, length(lineDirection));
            vec3 lineNormal = lineNormals[int(linePointId)];

            vec3 normal = lineNormal * linePositionOffset.x + cross(lineNormal, lineDirection) * linePositionOffset.z;

            position += normal * lineThickness;
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
    uniforms.setValue(gl, "lineThickness", this.userData.thickness);
    uniforms.setValue(gl, "lineNormals", this.userData._lineNormals);
    uniforms.setValue(gl, "linePositions", this.points);
    // this.material.uniforms.lineThickness.value = this.userData.thickness;
    // this.material.uniforms.lineNormals.value = this.userData._lineNormals;
    // this.material.uniforms.linePositions.value = this.points;
  }

  set thickness(value) {
    this.userData.thickness = value;
  }

  get thickness() {
    return this.userData.thickness;
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

    const uniformNormals = this.userData._lineNormals;
    for (let i = 0; i < this.points.length; i++) {
      const normal = this.normals[i];
      const normalArray = this._normalsArray[i];
      normal.x = normalArray[0];
      normal.y = normalArray[1];
      normal.z = normalArray[2];
      uniformNormals[i * 3] = normal.x;
      uniformNormals[i * 3 + 1] = normal.y;
      uniformNormals[i * 3 + 2] = normal.z;
    }
  }
}
