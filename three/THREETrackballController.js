import { Object3D } from "three/src/core/Object3D.js";

import TrackballController from "../3d/controllers/TrackballController.js";
import Matrix4 from "../math/Matrix4.js";

export default class THREETrackballController extends TrackballController {
  constructor(object3D = new Object3D(), {domElement, distance, distanceStep} = {}) {
    object3D.matrixAutoUpdate = false;
    object3D.updateMatrix();
    super(new Matrix4(object3D.matrix.elements), {domElement, distance, distanceStep});
    this.object3D = object3D;
  }

  update() {
    super.update();
    this.object3D.matrix.fromArray(this.matrix);
    this.object3D.matrixWorldNeedsUpdate = true;
  }
}
