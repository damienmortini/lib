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

  static add(src) {
    let split = src.split("/");
    let name = split[split.length - 1].split(".")[0];
    if (Sound.get(name)) {
      console.warn(`Sound ${name} already added`);
      return;
    }
    let sound = new Sound(src);
    sound.muted = muted ? true : sound._muted;
    sounds.set(name, sound);
  }

  static get(name) {
    return sounds.get(name);
  }

  constructor(src) {
    this.audio = document.createElement("audio");
    this.audio.src = src;

    this._muted = false;
  }

  get muted() {
    return this.audio.muted;
  }

  set muted(value) {
    if(!muted && !loopMuted) {
      this._muted = value;
    }
    this.audio.muted = value;
  }

  get loop() {
    return this.audio.loop;
  }

  set loop(value) {
    this.muted = value && loopMuted ? true : this._muted;
    this.audio.loop = value;
  }

  get volume() {
    return this.audio.volume;
  }

  set volume(value) {
    this.audio.volume = value;
  }

  play() {
    this.audio.play();
  }

  stop() {
    this.audio.currentTime = 0;
    this.pause();
  }

  pause() {
    this.audio.pause();
  }
}

if (/\bmuted\b/.test(window.location.search)) {
  Sound.muted = true;
}
