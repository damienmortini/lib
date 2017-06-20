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

    const length = this.points.length;

    for (let i = 0; i < length - 1; i++) {
      this.points[i].copy(this.points[i + 1]);
      this.normals[i].copy(this.normals[i + 1]);
    }

    for (let i = 0; i < COMPUTATION_POINTS_NUMBER; i++) {
      this._pointsTmp[i].copy(this.points[length - COMPUTATION_POINTS_NUMBER + i]);
      this._normalsTmp[i].copy(this.normals[length - COMPUTATION_POINTS_NUMBER + i]);
    }

    const pointsSave = this.points;
    const normalsSave = this.normals;

    this.points = this._pointsTmp;
    this.normals = this._normalsTmp;

    super.update();

    for (let i = 0; i < COMPUTATION_POINTS_NUMBER; i++) {
      pointsSave[length - COMPUTATION_POINTS_NUMBER + i].copy(this.points[i]);
      normalsSave[length - COMPUTATION_POINTS_NUMBER + i].copy(this.normals[i]);
    }

    this.points = pointsSave;
    this.normals = normalsSave;
  }
}