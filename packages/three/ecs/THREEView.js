import View from '../ecs/components/View.js'

export default class THREEView extends View {
  constructor(entity, {
    view = new THREE.Object3D(),
    visible,
    visibilityExecutor,
  } = {}) {
    super(entity, view, { visible, visibilityExecutor })
  }

  get position() {
    return this._view.position
  }

  get rotation() {
    return this._view.rotation
  }

  get quaternion() {
    return this._view.quaternion
  }

  get scale() {
    return this._view.scale
  }

  get object3D() {
    return this._view
  }
}
