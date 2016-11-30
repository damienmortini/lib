import { Object3D } from "three";

import View from "dlib/ecs/components/View.js";

export default class THREEView extends View {
  constructor(entity, {
    view = new Object3D(),
    visibilityExecutor = (resolve) => resolve()
  } = {}) {
    super(entity, view, {visibilityExecutor});
  }

  get position() {
    return this._view.position;
  }

  get rotation() {
    return this._view.rotation;
  }

  get quaternion() {
    return this._view.quaternion;
  }

  get scale() {
    return this._view.scale;
  }

  get object3D() {
    return this._view;
  }
}
