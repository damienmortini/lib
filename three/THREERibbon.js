import {
  Color,
  Vector3
} from "three";

import THREELine from "./THREELine.js";
import THREEShaderMaterial from "./THREEShaderMaterial.js";

import DVector3 from "../math/Vector3.js";

const COMPUTATION_POINTS_NUMBER = 3;

export default class THREERibbon extends THREELine {
  constructor({
    points,
    thickness,
    detail,
    geometry,
    material
  } = {}) {
    super({
      points,
      thickness,
      detail,
      geometry,
      material
    });
    
    this._pointsTmp = new Array(COMPUTATION_POINTS_NUMBER).fill().map(() => new Vector3());
    this._pointsArray = new Array(COMPUTATION_POINTS_NUMBER).fill().map(() => new DVector3());

    this._normalsTmp = new Array(COMPUTATION_POINTS_NUMBER).fill().map(() => new Vector3());
    this._normalsArray = new Array(COMPUTATION_POINTS_NUMBER).fill().map(() => new DVector3());

    this._uniformNormalsTmp = new Float32Array(COMPUTATION_POINTS_NUMBER * 3);
  }

  get head() {
    return this.points[this.points.length - 1];
  }

  update() {
    if(!this._initialized) {
      super.update();
      this._initialized = true;
      return;
    }

    // const length = this.points.length;
    // const uniformNormals = this.material.uniforms.lineNormals.value;

    // for (let i = 0; i < length - 1; i++) {
    //   let normal = this.normals[i];
    //   this.points[i].copy(this.points[i + 1]);
    //   normal.copy(this.normals[i + 1]);
    //   uniformNormals[i * 3] = normal.x;
    //   uniformNormals[i * 3 + 1] = normal.y;
    //   uniformNormals[i * 3 + 2] = normal.z;
    // }

    // for (let i = 0; i < COMPUTATION_POINTS_NUMBER; i++) {
    //   this._pointsTmp[i].copy(this.points[length - COMPUTATION_POINTS_NUMBER + i]);
    //   this._normalsTmp[i].copy(this.normals[length - COMPUTATION_POINTS_NUMBER + i]);
    // }

    // const pointsSave = this.points;
    // const normalsSave = this.normals;
    // const uniformNormalsSave = this.material.uniforms.lineNormals.value;

    // this.points = this._pointsTmp;
    // this.normals = this._normalsTmp;
    // this.material.uniforms.lineNormals.value = this._uniformNormalsTmp;

    // super.update();

    // for (let i = 0; i < COMPUTATION_POINTS_NUMBER; i++) {
    //   let j = length - COMPUTATION_POINTS_NUMBER + i;
    //   let normal = normalsSave[j];
    //   pointsSave[j].copy(this.points[i]);
    //   normal.copy(this.normals[i]);
    //   uniformNormalsSave[j * 3] = normal.x;
    //   uniformNormalsSave[j * 3 + 1] = normal.y;
    //   uniformNormalsSave[j * 3 + 2] = normal.z;
    // }

    // this.points = pointsSave;
    // this.normals = normalsSave;
    // this.material.uniforms.lineNormals.value = uniformNormalsSave;
  }
}