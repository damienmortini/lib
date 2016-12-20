import Signal from "dlib/utils/Signal.js";
import Ticker from "dlib/utils/Ticker.js";

export default class SoundMatrix extends Map {
  constructor({
    beats = 8,
    bpm = 240,
    autoplay = false
  } = {}) {
    super();

    this.bpm = bpm;
    this._beats = beats;

    this.beat = 0;

    this._clips = new Set();
    this._currentTime = 0;

    this._clones = new Map();

    this._paused = true;

    this.onBeat = new Signal();

    if(autoplay) {
      this.play();
    }
  }

  get beats() {
    return this._beats;
  }

  set(sound, array, {clip} = {}) {
    if(!this.get(sound)) {
      if(clip) {
        this._clips.add(sound);
      } else {
        this._clones.set(sound, new Array(this._beats).fill().map(() => {
          let clone = sound.cloneNode();
          clone.loop = false;
          return clone;
        }));
      }
      super.set(sound, new Float32Array(this._beats).fill(0));
    }
    let soundArray = this.get(sound);
    for (let i = 0; i < soundArray.length; i++) {
      soundArray[i] = array[i] || false;
    }
  }

  play() {
    Ticker.add(this._updateBinded = this._updateBinded || this._update.bind(this));
  }

  stop() {
    this.pause();
    this._currentTime = 0;
    for (let sound of this.keys()) {
      sound.stop();
    }
  }

  pause() {
    Ticker.delete(this._updateBinded);
    for (let sound of this.keys()) {
      sound.pause();
    }
  }

  _update() {
    this._currentTime += Ticker.deltaTime;

    let beat = Math.floor(this._currentTime / (60 / this.bpm)) % this._beats;

    if(this.beat !== beat) {
      for (let [sound, array] of this) {
        if(this._clips.has(sound)) {
          if(!beat) {
            sound.currentTime = 0;
            sound.play();
          }
          // sound.volume += ((array[beat] ? 1 : 0) - sound.volume) * .5 * this.bpm / 240;
          sound.muted = !array[beat];
        } else if (array[beat]) {
          let clone = this._clones.get(sound)[this.beat];
          clone.volume = sound.volume;
          clone.muted = sound.muted;
          clone.currentTime = 0;
          clone.play();
        }
      }

      this.onBeat.dispatch(beat);
    }

    this.beat = beat;
  }
}
