import {
  Vector3
} from "../../three/build/three.module.js";

import THREELine from "./THREELine.js";

import FrenetSerretFrame from "../math/FrenetSerretFrame.js";

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

    this.head = points[this.points.length - 1].clone();
  }

  update() {
    if(!this._initialized) {
      super.update();
      this._initialized = true;
      return;
    }

    this.userData._linePositions.copyWithin(0, 3);
    this.userData._lineNormals.copyWithin(0, 3);

    const headId = this.points.length - 1;
    this.userData._linePositions[headId * 3] = this.head.x;
    this.userData._linePositions[headId * 3 + 1] = this.head.y;
    this.userData._linePositions[headId * 3 + 2] = this.head.z;

    FrenetSerretFrame.compute({
      positions: this.userData._linePositions,
      normals: this.userData._lineNormals,
      range: [headId - 3, headId]
    });
  }
}