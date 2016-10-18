import { Mesh, PlaneGeometry, Texture, Object3D } from "three";

import THREEExtendedShaderMaterial from "dlib/three/THREEExtendedShaderMaterial.js";

export default class THREEText extends Object3D {
  constructor({
    textContent = "",
    font = "100px sans-serif",
    fillStyle = "black",
    textAlign = "start",
    shadowColor = "rgba(0, 0, 0 ,0)",
    shadowBlur = 0,
    scale = 1
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

    this._mesh = new Mesh(new PlaneGeometry(1, 1), new THREEExtendedShaderMaterial({
      type: "basic",
      transparent: true,
      uniforms: {
        map: this._texture
      }
    }));
    this.add(this._mesh);

    this._update();
  }

  _update() {
    if(!this._mesh) {
      return;
    }
    let width = this._context.measureText(this.textContent).width + this.shadowBlur * 2;
    let height = parseFloat(/\b(\d*)px/.exec(this._context.font)[1]) + this.shadowBlur * 2;
    if(this._canvas.width !== width || this._canvas.height !== height) {
      this._canvas.width = width;
      this._canvas.height = height;
      this._context = this._canvas.getContext("2d");
      this._context.font = this.font;
      this._context.fillStyle = this.fillStyle;
      this._context.shadowColor = this.shadowColor;
      this._context.shadowBlur = this.shadowBlur;
      this._context.textBaseline = "ideographic";
    }
    if(this.textAlign === "start" || this.textAlign === "left") {
      this._mesh.position.x = (this._canvas.width * .5 - this.shadowBlur) * this._scale;
    } else if (this.textAlign === "end" || this.textAlign === "right") {
      this._mesh.position.x = (-this._canvas.width * .5 + this.shadowBlur) * this._scale;
    } else {
      this._mesh.position.x = 0;
    }
    this._mesh.scale.x = this._canvas.width * this._scale;
    this._mesh.scale.y = this._canvas.height * this._scale;
    this._context.fillText(this._textContent, this.shadowBlur, this._canvas.height - this.shadowBlur);
    this._texture.needsUpdate = true;
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
}
