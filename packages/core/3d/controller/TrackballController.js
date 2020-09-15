import Matrix4 from '../../math/Matrix4.js';
import Vector2 from '../../math/Vector2.js';
import Vector3 from '../../math/Vector3.js';
import Quaternion from '../../math/Quaternion.js';
import GestureObserver from '../../input/GestureObserver.js';

export default class TrackballController {
  constructor({
    matrix = new Matrix4(),
    domElement = document.body,
    invertRotation = true,
    rotationVelocity = Math.PI / 180,
    rotationEaseRatio = .1,
    distance = 0,
    distanceMin = 0,
    distanceMax = Infinity,
    zoomEaseRatio = .1,
    zoomVelocity = .1,
    zoomDisabled = false,
    disabled = false,
  } = {}) {
    this.matrix = matrix;

    this.invertRotation = invertRotation;
    this.rotationVelocity = rotationVelocity;
    this.rotationEaseRatio = rotationEaseRatio;
    this.distanceMax = distanceMax;
    this.distanceMin = distanceMin;
    this.zoomVelocity = zoomVelocity;
    this.zoomEaseRatio = zoomEaseRatio;
    this.zoomDisabled = zoomDisabled;
    this.distance = distance;

    this._cachedQuaternion = new Quaternion();
    this._cachedMatrix = new Matrix4();
    this._cachedVector3 = new Vector3();

    this._velocity = new Vector2();
    this._velocityOrigin = new Vector2();

    this._position = new Vector3([this.matrix.x, this.matrix.y, this.matrix.z]);
    this._positionPrevious = this._position.clone();
    this._positionOffset = new Vector3();

    this.update();

    this.disabled = disabled;

    domElement.addEventListener('wheel', (event) => {
      if (this.zoomDisabled || this.disabled) return;
      this._distance *= 1 + event.deltaY * this.zoomVelocity * .01;
      this._distance = Math.max(this.distanceMin, Math.min(this.distanceMax, this._distance));
    }, { passive: true });

    const gestureObserver = new GestureObserver((gesture) => {
      if (this.disabled) {
        return;
      }
      this._velocity.x += (gesture.movementX * this.rotationVelocity - this._velocity.x) * rotationEaseRatio;
      this._velocity.y += (gesture.movementY * this.rotationVelocity - this._velocity.y) * rotationEaseRatio;
      if (!this.zoomDisabled) {
        this._distance /= 1 + gesture.movementScale * this.zoomVelocity * .1;
        this._distance = Math.max(this.distanceMin, Math.min(this.distanceMax, this._distance));
      }
    }, { pointerCapture: true });
    gestureObserver.observe(domElement);
  }

  set distance(value) {
    this._distance = this._distanceEased = value;
  }

  get distance() {
    return this._distance;
  }

  get distanceEased() {
    return this._distanceEased;
  }

  update() {
    this._cachedMatrix.identity();
    this._cachedQuaternion.identity();

    this._distanceEased += (this._distance - this._distanceEased) * this.zoomEaseRatio;

    this._position.set(this.matrix.x, this.matrix.y, this.matrix.z).subtract(this._positionOffset);

    this.matrix.x = 0;
    this.matrix.y = 0;
    this.matrix.z = 0;

    this._velocity.lerp(this._velocityOrigin, this.rotationEaseRatio);

    this._cachedQuaternion.rotateY(this.invertRotation ? -this._velocity.x : this._velocity.x);
    this._cachedQuaternion.rotateX(this.invertRotation ? -this._velocity.y : this._velocity.y);

    this._cachedMatrix.fromQuaternion(this._cachedQuaternion);

    this.matrix.multiply(this._cachedMatrix);

    this._positionOffset.set(0, 0, 1);
    this._positionOffset.applyMatrix4(this.matrix);
    this._positionOffset.scale(this._distanceEased);

    this._cachedVector3.copy(this._position).add(this._positionOffset);

    this.matrix.x = this._cachedVector3.x;
    this.matrix.y = this._cachedVector3.y;
    this.matrix.z = this._cachedVector3.z;
  }
}
