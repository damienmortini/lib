import Vector2 from '../../math/Vector2.js';
import Matrix4 from '../../math/Matrix4.js';

export default class OrbitController {
  constructor({
    matrix = new Matrix4(),
    domElement = window,
    pan = 0,
    tilt = 0,
    distance = 1,
    distanceMin = 0,
    distanceMax = Infinity,
    tiltMin = -Infinity,
    tiltMax = Infinity,
    panMin = -Infinity,
    panMax = Infinity,
    rotationEasing = .1,
    rotationVelocity = .005,
    zoomEasing = .2,
    zoomDisabled = false,
  }) {
    this.matrix = matrix;
    this.distanceMax = distanceMax;
    this.distanceMin = distanceMin;
    this.zoomEasing = zoomEasing;
    this.tiltMax = tiltMax;
    this.tiltMin = tiltMin;
    this.panMax = panMax;
    this.panMin = panMin;
    this.rotationEasing = rotationEasing;
    this.rotationVelocity = rotationVelocity;
    this.zoomDisabled = zoomDisabled;

    this._distance = distance;
    this._tilt = tilt;
    this._pan = pan;

    this._panEased = this._pan;
    this._tiltEased = this._tilt;
    this._distanceEased = this._distance;

    this._multiTouchMode = false;

    domElement.addEventListener('wheel', (event) => {
      if (this.zoomDisabled) {
        return;
      }
      if (event.deltaY < 0) {
        this._distance *= .925;
      } else {
        this._distance /= .925;
      }
      this._distance = Math.max(this.distanceMin, Math.min(this.distanceMax, this._distance));
    }, { passive: true });

    let previousSize = 0;
    let previousX = 0;
    let previousY = 0;
    const pointers = new Map();
    const pinchVector = new Vector2();
    const reset = () => {
      pinchVector.set(0, 0);
      previousSize = 0;
      previousX = 0;
      previousY = 0;
    };
    const onPointerDown = (event) => {
      if (!pointers.size) {
        domElement.addEventListener('pointermove', onPointerMove);
        domElement.addEventListener('pointerup', onPointerUp);
        domElement.addEventListener('pointerout', onPointerUp);
      }
      domElement.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, event);
      reset();
    };
    const onPointerMove = (event) => {
      pointers.set(event.pointerId, event);
      let x = 0;
      let y = 0;
      let index = 0;
      for (const pointer of pointers.values()) {
        if (index === 1) {
          pinchVector.x = x - pointer.screenX;
          pinchVector.y = y - pointer.screenY;
        }
        x += pointer.screenX;
        y += pointer.screenY;
        index++;
      }
      x /= pointers.size;
      y /= pointers.size;

      if (!previousX && !previousY) {
        previousX = x;
        previousY = y;
        return;
      }

      const movementX = x - previousX;
      const movementY = y - previousY;

      this._pan += -movementX * rotationVelocity;
      this._pan = Math.max(this.panMin, Math.min(this.panMax, this._pan));

      this._tilt += movementY * rotationVelocity;
      this._tilt = Math.max(this.tiltMin, Math.min(this.tiltMax, this._tilt));

      previousX = x;
      previousY = y;

      const size = pinchVector.size;
      if (previousSize && !this.zoomDisabled) {
        this._distance *= previousSize / size;
        this._distance = Math.max(this.distanceMin, Math.min(this.distanceMax, this._distance));
      }
      previousSize = size;
    };
    const onPointerUp = (event) => {
      pointers.delete(event.pointerId);
      domElement.releasePointerCapture(event.pointerId);
      reset();
      if (!pointers.size) {
        domElement.removeEventListener('pointermove', onPointerMove);
        domElement.removeEventListener('pointerup', onPointerUp);
        domElement.removeEventListener('pointerout', onPointerUp);
      }
    };
    domElement.addEventListener('pointerdown', onPointerDown);
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
  }
}
