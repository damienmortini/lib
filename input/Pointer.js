import Vector2 from "../math/Vector2.js";
import Signal from "../util/Signal.js";
import Ticker from "../util/Ticker.js";

const pointers = new Map();

export default class Pointer extends Vector2 {
  static get TOUCH_TYPE() {
    return "touchtype";
  }

  static get MOUSE_TYPE() {
    return "mousetype";
  }

  static get(domElement = window) {
    let pointer = pointers.get(domElement);
    if (!pointer) {
      pointer = new Pointer(domElement);
    }
    return pointer;
  }

  get downed() {
    return this._downed;
  }

  constructor(domElement) {
    super();

    this._domElement = domElement || window;

    this.type = Pointer.TOUCH_TYPE;

    this.velocity = new Vector2();
    this.dragOffset = new Vector2();

    this.centered = new Vector2();
    this.centeredFlippedY = new Vector2();
    this.normalized = new Vector2();
    this.normalizedFlippedY = new Vector2();
    this.normalizedCentered = new Vector2();
    this.normalizedCenteredFlippedY = new Vector2();

    this._downed = false;

    pointers.set(this._domElement, this);

    this.onDown = new Signal();
    this.onMove = new Signal();
    this.onUp = new Signal();
    this.onClick = new Signal();
    this.onTypeChange = new Signal();

    this._preventMouseTypeChange = false;

    this._onPointerMoveBinded = this._onPointerMove.bind(this);
    this._onPointerDownBinded = this._onPointerDown.bind(this);
    this._onPointerUpBinded = this._onPointerUp.bind(this);

    this._updateBinded = this._update.bind(this);
    this._resizeBinded = this.resize.bind(this);

    this._position = new Vector2();

    this.enable();
  }

  resize() {
    this._domElementBoundingRect = this._domElement === window ? {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    } : this._domElement.getBoundingClientRect();
  }

  _onPointerDown(e) {
    this.resize();
    if (e.type === "touchstart") {
      this._preventMouseTypeChange = true;
      this._changeType(Pointer.TOUCH_TYPE);
    }
    this._downed = true;
    this.dragOffset.set(0, 0);
    this.copy(this._position);
    this._onPointerEvent(e);
    this._updatePositions();
    this.onDown.dispatch(e);
  }

  _onPointerMove(e) {
    if (e.type === "mousemove") {
      if (this._preventMouseTypeChange) {
        return;
      } else {
        this._changeType(Pointer.MOUSE_TYPE);
      }
    }
    this._onPointerEvent(e);
    this.onMove.dispatch(e);
  }

  _onPointerUp(e) {
    if (!this._downed) {
      return;
    }
    this._downed = false;
    this._onPointerEvent(e);
    this._updatePositions();
    this.onUp.dispatch(e);
    if (this.dragOffset.size < 4) {
      this.onClick.dispatch(e);
    }
    clearTimeout(this._timeout);
    this._timeout = setTimeout(() => {
      this._preventMouseTypeChange = false;
    }, 2000);
  }

  _onPointerEvent(e) {
    if (!!window.TouchEvent && e instanceof window.TouchEvent) {
      if (e.type === "touchend") {
        e = e.changedTouches[0];
      } else {
        e = e.touches[0];
      }
    }
    this._position.x = e.clientX - this._domElementBoundingRect.left;
    this._position.y = e.clientY - this._domElementBoundingRect.top;
  }

  _changeType(type) {
    if (this.type === type) {
      return;
    }
    this.type = type;
    this.disable();
    this.enable();
    this.onTypeChange.dispatch(this.type);
  }

  _update() {
    if (this.x || this.y) {
      this.velocity.x = this._position.x - this.x;
      this.velocity.y = this._position.y - this.y;
      if (this.downed) {
        this.dragOffset.add(this.velocity);
      }
    }

    this._updatePositions();
  }

  _updatePositions() {
    this.x = this._position.x;
    this.y = this._position.y;

    if (!this.x && !this.y) {
      return;
    }

    this.centered.x = this.centeredFlippedY.x = this.x - this._domElementBoundingRect.width * .5;
    this.centered.y = this.centeredFlippedY.y = this.y - this._domElementBoundingRect.height * .5;
    this.centeredFlippedY.y *= -1;

    this.normalized.x = this.normalizedFlippedY.x = this.x / this._domElementBoundingRect.width;
    this.normalized.y = this.normalizedFlippedY.y = this.y / this._domElementBoundingRect.height;
    this.normalizedFlippedY.y = 1 - this.normalizedFlippedY.y;

    this.normalizedCentered.x = this.normalizedCenteredFlippedY.x = this.normalized.x * 2 - 1;
    this.normalizedCentered.y = this.normalizedCenteredFlippedY.y = this.normalized.y * 2 - 1;
    this.normalizedCenteredFlippedY.y *= -1;
  }

  enable() {
    this.disable();
    this.resize();
    if (this.type === Pointer.TOUCH_TYPE) {
      this._domElement.addEventListener("touchmove", this._onPointerMoveBinded);
      window.addEventListener("touchend", this._onPointerUpBinded);
    } else {
      this._domElement.addEventListener("mousedown", this._onPointerDownBinded);
      window.addEventListener("mouseup", this._onPointerUpBinded);
    }
    this._domElement.addEventListener("touchstart", this._onPointerDownBinded);
    this._domElement.addEventListener("mousemove", this._onPointerMoveBinded);
    window.addEventListener("resize", this._resizeBinded);
    Ticker.add(this._updateBinded = this._updateBinded || this._update.bind(this));
  }

  disable() {
    Ticker.delete(this._updateBinded);
    this._domElement.removeEventListener("touchstart", this._onPointerDownBinded);
    this._domElement.removeEventListener("mousedown", this._onPointerDownBinded);
    this._domElement.removeEventListener("touchmove", this._onPointerMoveBinded);
    this._domElement.removeEventListener("mousemove", this._onPointerMoveBinded);
    window.removeEventListener("touchend", this._onPointerUpBinded);
    window.removeEventListener("mouseup", this._onPointerUpBinded);
    window.removeEventListener("resize", this._resizeBinded);
  }
}
