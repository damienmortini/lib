import Ticker from "dlib/utils/Ticker.js";

export default class SoundMatrix extends Map {
  constructor({
    beats = 8,
    bpm = 240
  } = {}) {
    super();

    this.bpm = bpm;
    this._beats = beats;

    this.position = 0;

    this._clips = new Set();
    this._time = 0;

    this._clones = new Map();

    this._paused = true;
  }

  get beats() {
    return this._beats;
  }

  set(sound, array, {clip} = {}) {
    if(!this.get(sound)) {
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
      super.set(sound, new Float32Array(this._beats).fill(0));
    }
    let soundArray = this.get(sound);
    for (let i = 0; i < soundArray.length; i++) {
      soundArray[i] = array[i] || false;
    }
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

    let position = Math.floor(this._time / (60 / this.bpm)) % this._beats;

    for (let [sound, array] of this) {
      if(this.position !== position && this._clips.has(sound)) {
        if(!position) {
          sound.play();
        }
        // sound.volume += ((array[position] ? 1 : 0) - sound.volume) * .5 * this.bpm / 240;
        sound.muted = !array[position];
      } else if (this.position !== position && array[position]) {
        let clone = this._clones.get(sound)[this.position];
        clone.volume = sound.volume;
        clone.muted = sound.muted;
        clone.currentTime = 0;
        clone.play();
      }
    }

    this.position = position;
  }
}
