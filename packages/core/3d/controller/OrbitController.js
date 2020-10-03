import Matrix4 from '../../math/Matrix4.js';
import GestureObserver from '../../input/GestureObserver.js';

export default class OrbitController {
  constructor({
    matrix = new Matrix4(),
    domElement = null,
    pan = 0,
    tilt = 0,
    invertRotation = true,
    distance = 1,
    distanceMin = 0,
    distanceMax = Infinity,
    tiltMin = -Infinity,
    tiltMax = Infinity,
    tiltDisabled = false,
    panMin = -Infinity,
    panMax = Infinity,
    panDisabled = false,
    rotationEasing = .1,
    rotationVelocity = .005,
    zoomEasing = .1,
    zoomVelocity = .1,
    zoomDisabled = false,
  }) {
    this._selfMatrix = new Matrix4();

    this.matrix = matrix;
    this.invertRotation = invertRotation;
    this.distanceMax = distanceMax;
    this.distanceMin = distanceMin;
    this.zoomEasing = zoomEasing;
    this.tiltMax = tiltMax;
    this.tiltMin = tiltMin;
    this.tiltDisabled = tiltDisabled;
    this.panMax = panMax;
    this.panMin = panMin;
    this.panDisabled = panDisabled;
    this.rotationEasing = rotationEasing;
    this.rotationVelocity = rotationVelocity;
    this.zoomDisabled = zoomDisabled;
    this.zoomVelocity = zoomVelocity;

    this._distance = distance;
    this._tilt = tilt;
    this._pan = pan;

    this._panEased = this._pan;
    this._tiltEased = this._tilt;
    this._distanceEased = this._distance;

    this._multiTouchMode = false;

    if (domElement) {
      domElement.addEventListener('wheel', (event) => {
        if (this.zoomDisabled) return;
        this._distance = Math.max(this._distance, .001) * (1 + event.deltaY * this.zoomVelocity * .01);
        this._distance = Math.max(this.distanceMin, Math.min(this.distanceMax, this._distance));
      }, { passive: true });

      const gestureObserver = new GestureObserver((gesture) => {
        if (!this.panDisabled) {
          this._pan += (this.invertRotation ? -1 : 1) * gesture.movementX * rotationVelocity;
          this._pan = Math.max(this.panMin, Math.min(this.panMax, this._pan));
        }

        if (!this.tiltDisabled) {
          this._tilt += (this.invertRotation ? 1 : -1) * gesture.movementY * rotationVelocity;
          this._tilt = Math.max(this.tiltMin, Math.min(this.tiltMax, this._tilt));
        }

        if (!this.zoomDisabled) {
          this._distance /= 1 + gesture.movementScale * this.zoomVelocity * .01;
          this._distance = Math.max(this.distanceMin, Math.min(this.distanceMax, this._distance));
        }
      }, { pointerCapture: true });
      gestureObserver.observe(domElement);
    }

    this.update();
  }

  get pan() {
    return this._pan;
  }

  set pan(value) {
    value = Math.max(this.panMin, Math.min(this.panMax, value));
    this._pan = value;
    this._panEased = value;
  }

  get tilt() {
    return this._tilt;
  }

  set tilt(value) {
    value = Math.max(this.tiltMin, Math.min(this.tiltMax, value));
    this._tilt = value;
    this._tiltEased = value;
  }

  get distance() {
    return this._distance;
  }

  set distance(value) {
    value = Math.max(this.distanceMin, Math.min(this.distanceMax, value));
    this._distance = value;
    this._distanceEased = value;
  }

  get panEased() {
    return this._panEased;
  }

  get tiltEased() {
    return this._tiltEased;
  }

  get distanceEased() {
    return this._distanceEased;
  }

  update() {
    this._tiltEased += (this._tilt - this._tiltEased) * this.rotationEasing;
    this._panEased += (this._pan - this._panEased) * this.rotationEasing;
    this._distanceEased += (this._distance - this._distanceEased) * this.zoomEasing;

    this._selfMatrix.invert();
    this.matrix.multiply(this._selfMatrix);

    this._selfMatrix.identity();
    this._selfMatrix.rotateY(this._panEased);
    this._selfMatrix.rotateX(-this._tiltEased);
    const sinPan = Math.sin(this._panEased);
    const cosPan = Math.cos(this._panEased);
    const cosTilt = Math.cos(this._tiltEased);
    const sinTilt = Math.sin(this._tiltEased);
    this._selfMatrix.x = this._distanceEased * sinPan * cosTilt;
    this._selfMatrix.y = sinTilt * this._distanceEased;
    this._selfMatrix.z = this._distanceEased * cosPan * cosTilt;

    this.matrix.multiply(this._selfMatrix);
  }
}
