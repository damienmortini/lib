import Pointer from "../../input/Pointer.js";
import Matrix4 from "../../math/Matrix4.js";
import Vector2 from "../../math/Vector2.js";
import Vector3 from "../../math/Vector3.js";
import Quaternion from "../../math/Quaternion.js";

export default class TrackballController {
  constructor({
    matrix = new Matrix4(), 
    domElement = document.body,
    distance = 0,
    invertRotation = true,
    rotationEaseRatio = .04,
    zoomSpeed = .1,
    zoomEaseRatio = .1,
    minDistance = 0,
    maxDistance = Infinity,
    enabled = true
  } = {}) {
    this.matrix = matrix;

    this._distance = distance;
    this.invertRotation = invertRotation;
    this.rotationEaseRatio = rotationEaseRatio;
    this.maxDistance = maxDistance;
    this.minDistance = minDistance;
    this.zoomSpeed = zoomSpeed;
    this.zoomEaseRatio = zoomEaseRatio;
    
    this._pointer = Pointer.get(domElement);
    this._nextDistance = this._distance;
    
    this._cachedQuaternion = new Quaternion();
    this._cachedMatrix = new Matrix4();
    this._cachedVector3 = new Vector3();
    
    this._velocity = new Vector2();
    this._velocityOrigin = new Vector2();
    
    this._position = new Vector3([this.matrix.x, this.matrix.y, this.matrix.z]);
    this._positionPrevious = this._position.clone();
    this._positionOffset = new Vector3();
    
    domElement.addEventListener("wheel", this.onWheel.bind(this));
    
    this.enabled = true;
    this.update();
    this.enabled = enabled;
  }

  set distance(value) {
    this._distance = this._nextDistance = value;
  }

  get distance() {
    return this._distance;
  }

  onWheel(e) {
    if(!this.enabled) {
      return;
    }
    const scrollOffsetRatio = 1 + Math.abs(e.deltaY * this.zoomSpeed * .01);
    this._nextDistance = this._nextDistance || 1;
    this._nextDistance = e.deltaY > 0 ? this._nextDistance * scrollOffsetRatio : this._nextDistance / scrollOffsetRatio;
    this._nextDistance = Math.max(Math.min(this._nextDistance, this.maxDistance), this.minDistance);
  }

  update() {
    if(!this.enabled) {
      return;
    }

    this._cachedMatrix.identity();
    this._cachedQuaternion.identity();

    this._distance += (this._nextDistance - this._distance) * this.zoomEaseRatio;

    this._position.set(this.matrix.x, this.matrix.y, this.matrix.z).subtract(this._positionOffset);

    this.matrix.x = 0;
    this.matrix.y = 0;
    this.matrix.z = 0;

    if(this._pointer.downed) {
      this._velocity.copy(this._pointer.velocity).scale(.003);
    }

    this._velocity.lerp(this._velocityOrigin, this.rotationEaseRatio);

    this._cachedQuaternion.rotateY(this.invertRotation ? -this._velocity.x : this._velocity.x);
    this._cachedQuaternion.rotateX(this.invertRotation ? -this._velocity.y : this._velocity.y);

    this._cachedMatrix.fromQuaternion(this._cachedQuaternion);

    this.matrix.multiply(this._cachedMatrix);

    this._positionOffset.set(0, 0, 1);
    this._positionOffset.applyMatrix4(this.matrix);
    this._positionOffset.scale(this._distance);

    this._cachedVector3.copy(this._position).add(this._positionOffset);

    this.matrix.x = this._cachedVector3.x;
    this.matrix.y = this._cachedVector3.y;
    this.matrix.z = this._cachedVector3.z;
  }
}
