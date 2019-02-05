import Sprite from "./Sprite.js";
import Signal from "../util/Signal.js";
import Ticker from "../util/Ticker.js";

let SPRITESHEETS = new Map();

export default class SpriteAnimation {
  constructor({
    data = undefined,
    animation = undefined,
    playbackRate = 1,
    frameRate = 25,
    loop = false,
    autoplay = false,
  } = {}) {
    this._updateBinded = this.update.bind(this);

    this._sprite = new Sprite();

    this._currentTime = 0;

    this.loop = loop;
    this.playbackRate = playbackRate;
    this.frameRate = frameRate;
    this.data = data;
    this.animation = animation;

    this.onEnd = new Signal();

    if (autoplay) {
      this.play();
    }
  }

  set data(value) {
    if (this._data === value) {
      return;
    }
    this._data = value;
    this._animations = SPRITESHEETS.get(this._data);
    if (!this._animations) {
      this._animations = new Map();
      for (let key in this._data.frames) {
        let match = /(.*?)([0-9]+)[$\.]/.exec(key);
        let animationName = match[1];
        let frames = this._animations.get(animationName);
        if (!frames) {
          frames = [];
          this._animations.set(animationName, frames);
        }
        let position = parseInt(match[2]);
        frames[position - 1] = key;
      }
      SPRITESHEETS.set(this._data, this._animations);
    }

    this._sprite.data = this._data;

    this.animation = this.animation || [...this._animations.keys()][0];
  }

  get frame() {
    return this._sprite.frame;
  }

  get width() {
    return this._sprite.width;
  }

  get height() {
    return this._sprite.height;
  }

  get x() {
    return this._sprite.x;
  }

  get y() {
    return this._sprite.y;
  }

  get scale() {
    return this._sprite.scale;
  }

  get offsetX() {
    return this._sprite.offsetX;
  }

  get offsetY() {
    return this._sprite.offsetY;
  }

  get sourceWidth() {
    return this._sprite.sourceWidth;
  }

  get sourceHeight() {
    return this._sprite.sourceHeight;
  }

  get rotated() {
    return this._sprite.rotated;
  }

  set animation(value) {
    if (this._animation === value) {
      return;
    }
    this._animation = value;

    this._frames = this._animations.get(this._animation);

    this._sprite.frame = this._frames[Math.round(this._currentTime * (this._frames.length - 1))];
  }

  get animation() {
    return this._animation;
  }

  play() {
    Ticker.add(this._updateBinded);
  }

  pause() {
    Ticker.delete(this._updateBinded);
  }

  set currentTime(value) {
    if (this._currentTime === value) {
      return;
    }
    if (this.loop) {
      value = ((value % 1) + 1) % 1;
    } else {
      value = Math.min(Math.max(value, 0), 1);
      if (this._currentTime !== value && (value === 1 && this.playbackRate >= 0 || value === 0 && this.playbackRate < 0)) {
        this.onEnd.dispatch();
      }
    }
    if (this._currentTime !== value) {
      this._currentTime = value;
      this._sprite.frame = this._frames[Math.round(this._currentTime * (this._frames.length - 1))];
    }
  }

  get currentTime() {
    return this._currentTime;
  }

  get duration() {
    return this._frames.length / this.frameRate;
  }

  update() {
    if (!this._animations) {
      return;
    }
    this.currentTime += this.playbackRate * (this.frameRate / 60) * Ticker.timeScale / this._frames.length;
  }
}
