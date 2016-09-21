import { Object3D, Mesh, PlaneGeometry, MeshBasicMaterial, Texture, DoubleSide, LinearFilter } from "three";

let CACHED_IMAGES = new Map();

export default class Sprite extends Object3D {
  constructor(image, data = null, frame = null) {
    super();

    this.data = data;

    // Optimise images decoding
    let canvas = CACHED_IMAGES.get(image);

    if(!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      let context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      CACHED_IMAGES.set(image, canvas);
    }

    this.mesh = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({
      map: new Texture(canvas),
      transparent: true,
      side: DoubleSide
    }));
    this.mesh.scale.x = canvas.width;
    this.mesh.scale.y = canvas.height;
    this.mesh.material.map.minFilter = LinearFilter;
    this.mesh.material.map.generateMipmaps = false;
    this.mesh.material.map.needsUpdate = true;

    this.add(this.mesh);

    if(frame) {
      this.frame = frame;
    }
  }

  set material(value) {
    this.mesh.material = value;
  }

  get material() {
    return this.mesh.material;
  }

  set frame(value) {
    this._frame = value;

    let texture = this.mesh.material.map;
    let frameData = this.data.frames[this._frame];

    texture.repeat.x = (frameData.rotated ? frameData.frame.h : frameData.frame.w) / texture.image.width;
    texture.repeat.y = (frameData.rotated ? frameData.frame.w : frameData.frame.h) / texture.image.height;

    texture.offset.x = frameData.frame.x / texture.image.width;
    texture.offset.y = 1. - frameData.frame.y / texture.image.height - texture.repeat.y;

    let scale = 1 / this.data.meta.scale;

    this.mesh.scale.x = (frameData.rotated ? frameData.frame.h : frameData.frame.w) * scale;
    this.mesh.scale.y = (frameData.rotated ? frameData.frame.w : frameData.frame.h) * scale;

    this.mesh.position.x = (-(frameData.sourceSize.w - frameData.frame.w) * .5 + frameData.spriteSourceSize.x + frameData.sourceSize.w * (.5 - frameData.pivot.x)) * scale;
    this.mesh.position.y = ((frameData.sourceSize.h - frameData.frame.h) * .5 - frameData.spriteSourceSize.y - frameData.sourceSize.h * (.5 - frameData.pivot.y)) * scale;

    this.mesh.rotation.z = frameData.rotated ? Math.PI * .5 : 0;
  }

  get frame() {
    return this._frame;
  }
}
