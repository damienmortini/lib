let CACHED_IMAGES = new Map();

export default class Sprite {
  constructor({data, frame} = {}) {
    this.width = 0;
    this.height = 0;
    this.x = 0;
    this.y = 0;
    this.scale = 1;

    this.offsetX = 0;
    this.offsetY = 0;

    this.sourceWidth = 0;
    this.sourceHeight = 0;

    this.rotated = false;

    this.data = data;
    this.frame = frame;
  }

  set data(value) {
    if(this._data === value) {
      return;
    }
    this._data = value;
    this.scale = parseFloat(this._data.meta.scale);
  }

  get data() {
    return this._data;
  }

  set frame(value) {
    if(this._frame === value) {
      return;
    }

    this._frame = value;

    const frameData = this.data.frames[this._frame];

    this.rotated = frameData.rotated;

    this.x = frameData.frame.x;
    this.y = frameData.frame.y;
    this.width = this.rotated ? frameData.frame.h : frameData.frame.w;
    this.height = this.rotated ? frameData.frame.w : frameData.frame.h;

    this.sourceWidth = frameData.sourceSize.w;
    this.sourceHeight = frameData.sourceSize.h;

    this.offsetX = -(this.sourceWidth - frameData.frame.w) * .5 + frameData.spriteSourceSize.x + this.sourceWidth * (.5 - frameData.pivot.x);
    this.offsetY = -(this.sourceHeight - frameData.frame.h) * .5 + frameData.spriteSourceSize.y + this.sourceHeight * (.5 - frameData.pivot.y);
  }

  get frame() {
    return this._frame;
  }
}
