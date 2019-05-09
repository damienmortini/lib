import { Object3D, Mesh, Color, PlaneGeometry, Texture, DoubleSide, LinearFilter } from "../../../three/build/three.module.js";

import THREEShaderMaterial from "./THREEShaderMaterial.js";

let CACHED_IMAGES = new Map();

export default class Sprite extends Object3D {
  constructor(image, {data, frame, scale = 1} = {}) {
    super();

    this._data = data;
    this._image = image;
    this._scale = scale;

    // Optimise images decoding
    let canvas = CACHED_IMAGES.get(this.image);

    if(!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = this.image.width;
      canvas.height = this.image.height;
      let context = canvas.getContext("2d");
      context.drawImage(this.image, 0, 0);
      CACHED_IMAGES.set(this.image, canvas);
    }

    this.mesh = new Mesh(new PlaneGeometry(1, 1), new THREEShaderMaterial({
      type: "basic",
      transparent: true,
      side: DoubleSide,
      uniforms: {
        diffuse: new Color(0xffffff),
        map: new Texture(canvas)
      }
    }));
    this.mesh.scale.x = canvas.width * this._scale;
    this.mesh.scale.y = canvas.height * this._scale;
    this.mesh.material.map.minFilter = LinearFilter;
    this.mesh.material.map.generateMipmaps = false;
    this.mesh.material.map.needsUpdate = true;

    this.add(this.mesh);

    if(frame) {
      this.frame = frame;
    }
  }

  get image() {
    return this._image;
  }

  get data() {
    return this._data;
  }

  set material(value) {
    this.mesh.material = value;
    this.frame = this.frame;
  }

  get material() {
    return this.mesh.material;
  }

  set frame(value) {
    if(!this.data) {
      return;
    }

    this._frame = value;

    let offsetRepeat = this.mesh.material.offsetRepeat;
    let frameData = this.data.frames[this._frame];

    offsetRepeat.z = (frameData.rotated ? frameData.frame.h : frameData.frame.w) / this.image.width;
    offsetRepeat.w = (frameData.rotated ? frameData.frame.w : frameData.frame.h) / this.image.height;

    offsetRepeat.x = frameData.frame.x / this.image.width;
    offsetRepeat.y = 1. - frameData.frame.y / this.image.height - offsetRepeat.w;

    let scale = 1 / parseFloat(this.data.meta.scale);

    this.mesh.scale.x = (frameData.rotated ? frameData.frame.h : frameData.frame.w) * scale * this._scale;
    this.mesh.scale.y = (frameData.rotated ? frameData.frame.w : frameData.frame.h) * scale * this._scale;

    this.mesh.position.x = (-(frameData.sourceSize.w - frameData.frame.w) * .5 + frameData.spriteSourceSize.x + frameData.sourceSize.w * (.5 - frameData.pivot.x)) * scale * this._scale;
    this.mesh.position.y = ((frameData.sourceSize.h - frameData.frame.h) * .5 - frameData.spriteSourceSize.y - frameData.sourceSize.h * (.5 - frameData.pivot.y)) * scale * this._scale;

    this.mesh.rotation.z = frameData.rotated ? Math.PI * .5 : 0;
  }

  get frame() {
    return this._frame;
  }
}
