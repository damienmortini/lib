import THREE from "THREE";
import Signal from "signals";

import THREESprite from "./THREESprite.js";

import Ticker from "../utils/Ticker";

let SPRITESHEETS = new Map();

export default class THREESpriteAnimation extends THREESprite {
  constructor(image, data, animation, {
    startFrame = 0,
    speed = .5,
    loop = true,
    reverse = false
  } = {}) {

    let animations = SPRITESHEETS.get(data);

    if(!animations) {
      animations = new Map();
      for (let key in data.frames) {
        let match = /(.*?)([0-9]+)$/.exec(key);
        let animationName = match[1];
        if(!animations.has(animationName)) {
          animations.set(animationName, []);
        }
        let frames = animations.get(animationName);
        let position = parseInt(match[2]);
        frames[position - 1] = key;
      }

      SPRITESHEETS.set(data, animations);
    }

    super(image, data, animations.get(animation)[0]);

    this._progress = 0;
    this._animations = animations;

    this.loop = loop;
    this.reverse = reverse;
    this.speed = speed;
    this.animation = animation;

    this.onAnimationComplete = new Signal();

    this.play();
  }

  set animation(value) {
    if(this._animation === value) {
      return;
    }
    this._animation = value;

    this.update();
  }

  get animation() {
    return this._animation;
  }

  play() {
    Ticker.add(this.update, this, "game");
  }

  stop() {
    Ticker.remove(this.update, this, "game");
  }

  set progress(value) {
    if(this._progress === value) {
      return;
    }
    let previousProgress = this._progress;
    this._progress = value;
    if(this.loop) {
      this._progress = ((this._progress % 1) + 1) % 1;
    } else {
      this._progress = Math.min(Math.max(this._progress, 0), 1);
      if(previousProgress !== this._progress && (this._progress === 1 && !this.reverse || this._progress === 0 && this.reverse)) {
        this.onAnimationComplete.dispatch();
      }
    }
  }

  get progress() {
    return this._progress;
  }

  update() {
    let frames = this._animations.get(this.animation);
    this.progress += (this.speed * Ticker.timeScale / frames.length) * (this.reverse ? -1 : 1);
    this.frame = frames[Math.round(this._progress * (frames.length - 1))];
  }
}
