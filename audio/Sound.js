import Environment from "../util/Environment.js";

const sounds = new Map();

let muted = false;
let loopMuted = false;
let initialized = true;

if (Environment.mobile) {
  initialized = false;

  const onTouchEnd = () => {
    window.removeEventListener("touchend", onTouchEnd);
    for (const sound of sounds.values()) {
      sound._audio.play();
      if (!sound._audio.autoplay) {
        const pauseElement = () => {
          sound._audio.pause();
          sound._audio.removeEventListener("playing", pauseElement);
        };
        sound._audio.addEventListener("playing", pauseElement);
      }
    }
    initialized = true;
  };

  window.addEventListener("touchend", onTouchEnd);
}

export default class Sound {
  static set muted(value) {
    muted = value;
    for (const sound of sounds.values()) {
      sound.muted = sound.muted;
    }
  }

  static get muted() {
    return muted;
  }

  static set loopMuted(value) {
    loopMuted = value;
    for (const sound of sounds.values()) {
      sound.muted = sound.muted;
    }
  }

  static get loopMuted() {
    return loopMuted;
  }

  static add(options) {
    const sound = new Sound(options);
    return sound;
  }

  static get(name) {
    return sounds.get(name);
  }

  constructor({
    src,
    name = src,
    amplification = 1,
    volume = 1,
    loop = false,
    autoplay = false,
  }) {
    this.name = name;

    if (sounds.get(this.name)) {
      throw new Error(`Sound with name/src "${this.name}" already exists, choose another name or use Sound.get(name) to get sound.`);
    }
    sounds.set(this.name, this);

    this._audio = document.createElement("audio");
    this._audio.src = src;

    this.amplification = amplification;
    this.volume = volume;
    this.loop = loop;
    this.autoplay = autoplay;

    this.muted = muted;
  }

  get src() {
    return this._audio.src;
  }

  set src(value) {
    this._audio.src = value;
  }

  get muted() {
    return this._muted;
  }

  set muted(value) {
    this._muted = value;
    this._audio.muted = muted || loopMuted && this.loop ? true : value;
  }

  get paused() {
    return this._audio.paused;
  }

  get loop() {
    return this._audio.loop;
  }

  set loop(value) {
    this.muted = this.muted;
    this._audio.loop = value;
  }

  get currentTime() {
    return this._audio.currentTime;
  }

  set currentTime(value) {
    this._audio.currentTime = value;
  }

  get autoplay() {
    return this._audio.autoplay;
  }

  set autoplay(value) {
    this._audio.autoplay = value;
  }

  get duration() {
    return this._audio.duration;
  }

  get volume() {
    return this._volume;
  }

  set volume(value) {
    this._volume = value;
    this._audio.volume = this._volume * this.amplification;
  }

  play() {
    if (!initialized) {
      return;
    }
    this._audio.play();
  }

  stop() {
    this.currentTime = 0;
    this.pause();
  }

  pause() {
    this._audio.pause();
  }
}
