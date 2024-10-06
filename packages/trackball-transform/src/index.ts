import { GestureObserver } from '@damienmortini/gesture-observer';
import { Matrix4, Quaternion, Vector2, Vector3 } from '@damienmortini/math';

export class TrackballTransform {
  matrix: Matrix4;
  inverted: boolean;
  rotationVelocity: number;
  rotationEaseRatio: number;
  distanceMax: number;
  distanceMin: number;
  zoomVelocity: number;
  zoomEaseRatio: number;
  zoomDisabled: boolean;
  disabled: boolean;

  #cachedMatrix = new Matrix4();
  #cachedQuaternion = new Quaternion();
  #positionOffset = new Vector3();
  #cachedVector3 = new Vector3();
  #velocity = new Vector2();
  #velocityOrigin = new Vector2();
  #distanceEased = 0;
  #distance = 0;
  #position: Vector3;

  constructor({
    matrix = new Matrix4(),
    domElement = document.body,
    inverted = false,
    rotationVelocity = Math.PI / 180,
    rotationEaseRatio = 0.05,
    distance = 0,
    distanceMin = 0,
    distanceMax = Infinity,
    zoomEaseRatio = 0.1,
    zoomVelocity = 0.1,
    zoomDisabled = false,
    disabled = false,
    pointerCapture = false,
  } = {}) {
    this.matrix = matrix;

    this.inverted = inverted;
    this.rotationVelocity = rotationVelocity;
    this.rotationEaseRatio = rotationEaseRatio;
    this.distanceMax = distanceMax;
    this.distanceMin = distanceMin;
    this.zoomVelocity = zoomVelocity;
    this.zoomEaseRatio = zoomEaseRatio;
    this.zoomDisabled = zoomDisabled;
    this.distance = distance;

    this.#position = new Vector3([this.matrix.x, this.matrix.y, this.matrix.z]);

    this.update();

    this.disabled = disabled;

    domElement.addEventListener(
      'wheel',
      (event) => {
        if (this.zoomDisabled || this.disabled) return;
        this.#distance *= 1 + event.deltaY * this.zoomVelocity * 0.01;
        this.#distance = Math.max(this.distanceMin, Math.min(this.distanceMax, this.#distance));
      },
      { passive: true },
    );

    const gestureObserver = new GestureObserver((gesture) => {
      if (this.disabled) {
        return;
      }
      this.#velocity.x += (gesture.movementX * this.rotationVelocity - this.#velocity.x) * rotationEaseRatio;
      this.#velocity.y += (gesture.movementY * this.rotationVelocity - this.#velocity.y) * rotationEaseRatio;
      if (!this.zoomDisabled) {
        this.#distance *= 1 + (1 - gesture.movementScale) * this.zoomVelocity * 10;
        this.#distance = Math.max(this.distanceMin, Math.min(this.distanceMax, this.#distance));
      }
    });
    gestureObserver.observe(domElement, { pointerCapture });
  }

  set distance(value) {
    this.#distance = this.#distanceEased = value;
  }

  get distance() {
    return this.#distance;
  }

  get distanceEased() {
    return this.#distanceEased;
  }

  update() {
    this.#cachedMatrix.identity();
    this.#cachedQuaternion.identity();

    this.#distanceEased += (this.#distance - this.#distanceEased) * this.zoomEaseRatio;

    this.#position.set([this.matrix.x, this.matrix.y, this.matrix.z]);
    this.#position.subtract(this.#positionOffset);

    this.matrix.x = 0;
    this.matrix.y = 0;
    this.matrix.z = 0;

    this.#velocity.lerp(this.#velocityOrigin, this.rotationEaseRatio);

    this.#cachedQuaternion.rotateY(-this.#velocity.x);
    this.#cachedQuaternion.rotateX(-this.#velocity.y);

    this.#cachedMatrix.fromQuaternion(this.#cachedQuaternion);

    if (this.inverted) {
      this.#cachedMatrix.invert();
      this.matrix.multiply(this.#cachedMatrix, this.matrix);
    }
    else {
      this.matrix.multiply(this.#cachedMatrix);
    }

    this.#positionOffset.set([0, 0, 1]);
    this.#positionOffset.applyMatrix4(this.matrix);
    this.#positionOffset.scale(this.#distanceEased);

    this.#cachedVector3.copy(this.#position).add(this.#positionOffset);

    this.matrix.x = this.#cachedVector3.x;
    this.matrix.y = this.#cachedVector3.y;
    this.matrix.z = this.#cachedVector3.z;
  }
}
