import Vector2 from "../math/Vector2.js";

import Signal from "dlib/utils/Signal";

let pointers = new Map();

export default class Pointer extends Vector2 {
  constructor(domElement = document.body) {
    super();

    this.domElement = domElement;

    this.type = undefined;

    this._position = new Vector2();

    this.velocity = new Vector2();
    this.normalized = new Vector2();
    this.normalizedFlippedY = new Vector2();
    this.normalizedCentered = new Vector2();
    this.normalizedCenteredFlippedY = new Vector2();

    pointers.set(this.domElement, this);

    this.onDown = new Signal();
    this.onMove = new Signal();
    this.onUp = new Signal();
    this.onTypeChange = new Signal();

    this._preventMouseTypeChange = false;

    this._onPointerMoveBinded = this.onPointerMove.bind(this);
    this._onPointerDownBinded = this.onPointerDown.bind(this);
    this._onPointerUpBinded = this.onPointerUp.bind(this);
    this._resizeBinded = this.resize.bind(this);
    this._updateBinded = this.update.bind(this);

    this.resize();
    this.enable();
  }
  resize() {
    this._domElementBoundingRect = this.domElement.getBoundingClientRect();
  }
  onPointerDown(e) {
    if(this._preventMouseTypeChange) {
      return;
    }
    if(e.type === "touchstart") {
      this._preventMouseTypeChange = true;
    }
    this._updatePosition(e);
    this.update();
    this.onDown.dispatch();
  }
  onPointerMove(e) {
    if(e.type === "mousemove" && this._preventMouseTypeChange) {
      return;
    }
    this._updatePosition(e);
    this.onMove.dispatch();
  }
  onPointerUp(e) {
    if(e.type === "mouseup") {
      this._preventMouseTypeChange = false;
    }
    this._updatePosition(e);
    this.update();
    this.onUp.dispatch();
  }
  _updatePosition(e) {
    if (!!window.TouchEvent && e instanceof window.TouchEvent) {
      if(e.type !== "touchend") {
        e = e.touches[0];
      }
      if(this.type !== Pointer.TOUCH_TYPE) {
        this.type = Pointer.TOUCH_TYPE;
        this.onTypeChange.dispatch(this.type);
      }
    } else {
      if(this.type !== Pointer.MOUSE_TYPE && e.type !== "mouseup" && !this._preventMouseTypeChange) {
        this.type = Pointer.MOUSE_TYPE;
        this.onTypeChange.dispatch(this.type);
      }
    }
    this._position.x = e.clientX - this._domElementBoundingRect.left;
    this._position.y = e.clientY - this._domElementBoundingRect.top;
  }
  update() {
    this._requestAnimationFrameId = requestAnimationFrame(this._updateBinded);

    if(this.x || this.y) {
      this.velocity.x = this.x - this._position.x;
      this.velocity.y = this.y - this._position.y;
    }
    this.x = this._position.x;
    this.y = this._position.y;

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
    this.domElement.addEventListener("touchstart", this._onPointerDownBinded);
    this.domElement.addEventListener("mousedown", this._onPointerDownBinded);
    this.domElement.addEventListener("touchmove", this._onPointerMoveBinded);
    this.domElement.addEventListener("mousemove", this._onPointerMoveBinded);
    this.domElement.addEventListener("touchend", this._onPointerUpBinded);
    this.domElement.addEventListener("mouseup", this._onPointerUpBinded);
    window.addEventListener("resize", this._resizeBinded);
    this.update();
  }
  disable() {
    cancelAnimationFrame(this._requestAnimationFrameId);
    this.domElement.removeEventListener("touchdown", this._onPointerDownBinded);
    this.domElement.removeEventListener("mousedown", this._onPointerDownBinded);
    this.domElement.removeEventListener("touchmove", this._onPointerMoveBinded);
    this.domElement.removeEventListener("mousemove", this._onPointerMoveBinded);
    this.domElement.removeEventListener("touchend", this._onPointerUpBinded);
    this.domElement.removeEventListener("mouseup", this._onPointerUpBinded);
    window.removeEventListener("resize", this._resizeBinded);
  }
  static get TOUCH_TYPE() {
    return "touchtype";
  }
  static get MOUSE_TYPE() {
    return "mousetype";
  }
  static get(domElement) {
    let pointer = pointers.get(domElement);
    if (!pointer) {
      pointer = new Pointer(domElement);
    }
    return pointer;
  }
}
