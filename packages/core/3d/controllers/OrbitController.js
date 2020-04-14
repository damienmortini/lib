import Pointer from '../../input/Pointer.js';
import Ticker from '../../util/Ticker.js';
import Vector2 from '../../math/Vector2.js';
import Matrix4 from '../../math/Matrix4.js';

const VECTOR2 = new Vector2();

export default class OrbitController {
  constructor({
    matrix = new Matrix4(),
    domElement = window,
    pan = Math.PI * .25,
    tilt = Math.PI * .25,
    distance = 1,
    distanceMin = 0,
    distanceMax = Infinity,
    tiltMin = -Infinity,
    tiltMax = Infinity,
    panMin = -Infinity,
    panMax = Infinity,
  }) {
    this.matrix = matrix;
    this.distanceMax = distanceMax;
    this.distanceMin = distanceMin;
    this.tiltMax = tiltMax;
    this.tiltMin = tiltMin;
    this.panMax = panMax;
    this.panMin = panMin;

    this._distance = distance;
    this._tilt = tilt;
    this._pan = pan;

    this._panEased = this._pan;
    this._tiltEased = this._tilt;
    this._distanceEased = this._distance;

    this._multiTouchMode = false;

    this._pointer = Pointer.get(domElement);
    domElement.addEventListener('wheel', (event) => {
      if (event.deltaY < 0) {
        this._distance *= .925;
      } else {
        this._distance /= .925;
      }
      this._distance = Math.max(this.distanceMin, Math.min(this.distanceMax, this._distance));
    }, { passive: true });

    let previousSize = 0;

    domElement.addEventListener('touchstart', () => {
      previousSize = 0;
    }, { passive: true });
    domElement.addEventListener('touchmove', (event) => {
      if (event.touches.length > 1) {
        this._multiTouchMode = true;
        VECTOR2.x = event.touches[0].screenX - event.touches[1].screenX;
        VECTOR2.y = event.touches[0].screenY - event.touches[1].screenY;
        const size = VECTOR2.size;
        if (previousSize) {
          this._distance *= previousSize / size;
          this._distance = Math.max(this.distanceMin, Math.min(this.distanceMax, this._distance));
        }
        previousSize = size;
      }
    }, { passive: true });
    domElement.addEventListener('touchend', () => {
      previousSize = 0;
      this._multiTouchMode = false;
    }, { passive: true });
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
    if (this._pointer.downed && !this._multiTouchMode) {
      this._pan += -this._pointer.velocity.x * .005 * Ticker.smoothTimeScale;
      this._pan = Math.max(this.panMin, Math.min(this.panMax, this._pan));

      this._tilt += this._pointer.velocity.y * .005 * Ticker.smoothTimeScale;
      this._tilt = Math.max(this.tiltMin, Math.min(this.tiltMax, this._tilt));
    }

    this._tiltEased += (this._tilt - this._tiltEased) * .2;
    this._panEased += (this._pan - this._panEased) * .2;
    this._distanceEased += (this._distance - this._distanceEased) * .2;

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
  }
}
