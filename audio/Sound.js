let sounds = new Set();
let soundsMap = new Map();

let muted = false;
let loopMuted = false;

export default class Sound {
  static set muted(value) {
    muted = value;
    for (let sound of sounds) {
      sound.muted = sound.muted;
    }
  }

  static get muted() {
    return muted;
  }

  static set loopMuted(value) {
    loopMuted = value;
    for (let sound of sounds) {
      sound.muted = sound.muted;
    }
  }

  static get loopMuted() {
    return loopMuted;
  }

  static add(src) {
    let sound = new Sound(src);
    return sound;
  }

  static get(name) {
    return soundsMap.get(name);
  }

  constructor(src, {
    name = /([^\\\/]*)\..*$/.exec(src)[1],
    amplification = 1
  } = {}) {
    sounds.add(this);
    soundsMap.set(name, this);

    this._audio = document.createElement("audio");
    this._audio.src = src;

    this.amplification = amplification;

    this.volume = 1;
    this.muted = muted;
  }

  get src() {
    return this._audio.src;
  }

  set src(value) {
    this._audio.src = value;
  }

  get muted() {
    return this._audio.muted;
  }

  set muted(value) {
    this._muted = value;
    this._audio.muted = muted || loopMuted && this.loop ? true : value;
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

  get volume() {
    return this._volume;
  }

  set volume(value) {
    this._volume = value;
    this._audio.volume = this._volume * this.amplification;
  }

  play() {
    this._audio.play();
  }

  stop() {
    this.currentTime = 0;
    this.pause();
  }

  pause() {
    this._audio.pause();
  }

  cloneNode() {
    let sound = new Sound(this.src);
    sound.volume = this.volume;
    sound.muted = this.muted;
    sound.loop = this.loop;
    sound.currentTime = this.currentTime;

    return sound;
  }
}

Sound.muted = /\bmuted\b/.test(window.location.search);
Sound.loopMuted = /\bloopmuted\b/.test(window.location.search);
