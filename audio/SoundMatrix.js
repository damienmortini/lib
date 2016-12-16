import Ticker from "dlib/utils/Ticker.js";

export default class SoundMatrix extends Map {
  constructor({
    beats = 8,
    bpm = 240
  } = {}) {
    super();

    this.bpm = bpm;
    this._beats = beats;

    this._clips = new Set();
    this._time = 0;
    this._tickId = 0;

    this._clones = new Map();

    this._paused = true;
  }

  _addSound(sound, {clip = false} = {}) {
    super.set(sound, new Float32Array(this._beats).fill(0));
    if(clip) {
      this._clips.add(sound);
    } else {
      for (let i = 0; i < this._beats; i++) {
        this._clones.set(sound, new Array(this._beats).fill().map(() => {
          let clone = sound.cloneNode();
          clone.loop = false;
          return clone;
        }));
      }
    }
  }

  set(sound, array, {clip} = {}) {
    if(!this.get(sound)) {
      this._addSound(sound, {clip});
    }
    let soundArray = this.get(sound);
    for (let i = 0; i < soundArray.length; i++) {
      soundArray[i] = array[i] || false;
    }
  }

  get(sound, {clip} = {}) {
    let array = super.get(sound);
    if(!array) {
      this._addSound(sound, {clip});
    }
    return array;
  }

  play() {
    this._paused = false;
  }

  stop() {
    this.pause();
    this._time = 0;
    for (let sound of this.keys()) {
      sound.stop();
    }
  }

  pause() {
    this._paused = true;
    for (let sound of this.keys()) {
      sound.pause();
    }
  }

  update() {
    if(this._paused) {
      return;
    }

    this._time += Ticker.deltaTime;

    let tickId = Math.floor(this._time / (60 / this.bpm)) % this._beats;

    for (let [sound, array] of this) {
      if(this._clips.has(sound)) {
        if(!tickId) {
          sound.play();
        }
        sound.volume += ((array[tickId] ? 1 : 0) - sound.volume) * .5 * this.bpm / 240;
      } else if (array[tickId] && this._tickId !== tickId) {
        let clone = this._clones.get(sound)[this._tickId];
        clone.volume = sound.volume;
        clone.muted = sound.muted;
        clone.currentTime = 0;
        clone.play();
      }
    }

    this._tickId = tickId;
  }
}
