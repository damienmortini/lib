import Matrix4 from '../../math/Matrix4.js';
import GestureObserver from '../../input/GestureObserver.js';

export default class OrbitController {
  constructor({
    matrix = new Matrix4(),
    domElement = window,
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

    this.baseMatrix = new Matrix4(this.matrix);

    this._distance = distance;
    this._tilt = tilt;
    this._pan = pan;

    this._panEased = this._pan;
    this._tiltEased = this._tilt;
    this._distanceEased = this._distance;

    this._multiTouchMode = false;

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
    });
    gestureObserver.observe(domElement);

    this.update();
  }

  get pan() {
    return this._pan;
  }

  set pan(value) {
    this._pan = value;
    this._panEased = value;
  }

  get tilt() {
    return this._tilt;
  }

  set tilt(value) {
    this._tilt = value;
    this._tiltEased = value;
  }

  get distance() {
    return this._distance;
  }

  set distance(value) {
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

    this.matrix.identity();
    this.matrix.rotateY(this._panEased);
    this.matrix.rotateX(-this._tiltEased);
    const sinPan = Math.sin(this._panEased);
    const cosPan = Math.cos(this._panEased);
    const cosTilt = Math.cos(this._tiltEased);
    const sinTilt = Math.sin(this._tiltEased);
    this.matrix.x = this._distanceEased * sinPan * cosTilt;
    this.matrix.y = sinTilt * this._distanceEased;
    this.matrix.z = this._distanceEased * cosPan * cosTilt;

    this.matrix.multiply(this.baseMatrix);
  }
}
