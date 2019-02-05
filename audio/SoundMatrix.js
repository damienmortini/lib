import Signal from "../util/Signal.js";

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
        this._clones.set(sound, new Array(Math.min(this.beats, 4)).fill().map(() => {
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
    clearInterval(this._intervalId);
    this._intervalId = setInterval(this._updateBinded = this._updateBinded || this._update.bind(this), 60000 / this.bpm);
  }

  stop() {
    this.pause();
    this._currentTime = 0;
    for (let sound of this.keys()) {
      sound.stop();
    }
  }

  pause() {
    clearInterval(this._intervalId);
    for (let sound of this.keys()) {
      sound.pause();
    }
  }

  _update() {
    this.beat = (this.beat + 1) % this._beats;

    for (let [sound, array] of this) {
      if(this._clips.has(sound)) {
        if(!this.beat) {
          sound.currentTime = 0;
          sound.play();
        }
        sound.muted = !array[this.beat];
      } else if (array[this.beat]) {
        let clone = this._clones.get(sound)[this.beat % this._clones.get(sound).length];
        clone.volume = sound.volume;
        clone.muted = sound.muted;
        clone.currentTime = 0;
        clone.play();
      }
    }

    this.onBeat.dispatch(this.beat);
  }
}
