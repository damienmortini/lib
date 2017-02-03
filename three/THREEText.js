import { Mesh, PlaneGeometry, Texture, Object3D } from "three";

import THREEShaderMaterial from "dlib/three/THREEShaderMaterial.js";

export default class THREEText extends Object3D {
  constructor({
    textContent = "",
    font = "100px sans-serif",
    fillStyle = "black",
    textAlign = "start",
    shadowColor = "rgba(0, 0, 0 ,0)",
    shadowBlur = 0,
    shadowOffsetX = 0,
    shadowOffsetY = 0,
    scale = 1,
    geometry = new PlaneGeometry(1, 1),
    material = new THREEShaderMaterial({
      type: "basic",
      transparent: true
    })
  } = {}) {
    super();

    this._scale = scale;

    this._canvas = document.createElement("canvas");
    this._context = this._canvas.getContext("2d");

    this._texture = new Texture(this._canvas);
    this._texture.generateMipmaps = false;
    this._texture.minFilter = THREE.LinearFilter;

    this.textContent = textContent;
    this.font = font;
    this.fillStyle = fillStyle;
    this.textAlign = textAlign;
    this.shadowColor = shadowColor;
    this.shadowBlur = shadowBlur;
    this.shadowOffsetX = shadowOffsetX;
    this.shadowOffsetY = shadowOffsetY;

    material.map = this._texture;

    this._mesh = new Mesh(geometry, material);
    this.add(this._mesh);

    this._update();
  }

  _update() {
    if(!this._mesh) {
      return;
    }

    let offsetX = this.shadowOffsetX - this.shadowBlur;
    let offsetY = this.shadowOffsetY - this.shadowBlur;

    let width = this._context.measureText(this.textContent).width + this.shadowBlur * 2 + Math.abs(this.shadowOffsetX);
    let height = parseFloat(/\b(\d*)px/.exec(this._context.font)[1]) + this.shadowBlur * 2 + Math.abs(this.shadowOffsetY);
    if(this._canvas.width !== width || this._canvas.height !== height) {
      this._canvas.width = width;
      this._canvas.height = height;
      this._context = this._canvas.getContext("2d");
      this._context.font = this.font;
      this._context.fillStyle = this.fillStyle;
      this._context.shadowColor = this.shadowColor;
      this._context.shadowBlur = this.shadowBlur;
      this._context.shadowOffsetX = this.shadowOffsetX;
      this._context.shadowOffsetY = this.shadowOffsetY;
      this._context.textBaseline = "ideographic";
    }

    this._mesh.position.y = -offsetY * .5 * this._scale;

    if(this.textAlign === "start" || this.textAlign === "left") {
      this._mesh.position.x = (this._canvas.width * .5 + Math.min(0, offsetX)) * this._scale;
    } else if (this.textAlign === "end" || this.textAlign === "right") {
      this._mesh.position.x = (-this._canvas.width * .5 + Math.max(0, offsetX)) * this._scale;
    } else {
      this._mesh.position.x = offsetX * .5 * this._scale;
    }
    this._mesh.scale.x = this._canvas.width * this._scale;
    this._mesh.scale.y = this._canvas.height * this._scale;
    this._context.fillText(this._textContent, offsetX < 0 ? Math.abs(offsetX) : 0, this._canvas.height - (offsetY > 0 ? Math.abs(offsetY) : 0));
    this._texture.needsUpdate = true;
  }

  get material() {
    return this._mesh.material;
  }

  set textContent(value) {
    this._textContent = value;
    this._update();
  }

  get textContent() {
    return this._textContent;
  }

  set font(value) {
    this._context.font = this._font = value;
    this._update();
  }

  get font() {
    return this._font;
  }

  set fillStyle(value) {
    this._context.fillStyle = this._fillStyle = value;
    this._update();
  }

  get fillStyle() {
    return this._fillStyle;
  }

  set textAlign(value) {
    this._textAlign = value;
    this._update();
  }

  get textAlign() {
    return this._textAlign;
  }

  set shadowColor(value) {
    this._context.shadowColor = this._shadowColor = value;
    this._update();
  }

  get shadowColor() {
    return this._shadowColor;
  }

  set shadowBlur(value) {
    this._context.shadowBlur = this._shadowBlur = value;
    this._update();
  }

  get shadowBlur() {
    return this._shadowBlur;
  }

  set shadowOffsetX(value) {
    this._context.shadowOffsetX = this._shadowOffsetX = value;
    this._update();
  }

  get shadowOffsetX() {
    return this._shadowOffsetX;
  }

  set shadowOffsetY(value) {
    this._context.shadowOffsetY = this._shadowOffsetY = value;
    this._update();
  }

  get shadowOffsetY() {
    return this._shadowOffsetY;
  }
}
