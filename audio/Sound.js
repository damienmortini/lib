let sounds = new Map();

let loopMuted = /\loopmuted\b/.test(window.location.search);

let muted = false;

export default class Sound {
  static set muted(value) {
    muted = value;
    for (let sound of sounds) {
      sound.muted = value ? true : sound._muted;
    }
  }

  static get muted() {
    return muted;
  }

  static add(src, {
    name = /([^\\\/]*)\..*$/.exec(src)[1]
  } = {}) {
    if (Sound.get(name)) {
      console.warn(`Sound ${name} already added`);
      return;
    }
    let sound = new Sound(src);
    sound.muted = muted ? true : sound._muted;
    sounds.set(name, sound);
    return sound;
  }

  static get(name) {
    return sounds.get(name);
  }

  constructor(src, {
    amplification = 1
  } = {}) {
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
    if(!muted && !loopMuted) {
      this._muted = value;
    }
    this._audio.muted = this._muted;
  }

  get loop() {
    return this._audio.loop;
  }

  set loop(value) {
    this.muted = value && loopMuted ? true : this._muted;
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

if (/\bmuted\b/.test(window.location.search)) {
  Sound.muted = true;
}
