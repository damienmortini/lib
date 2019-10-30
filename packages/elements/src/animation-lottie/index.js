import Loader from '../../../lib/src/util/Loader.js';

const style = document.createElement('style');
style.textContent = `
  dlmn-lottie {
    display: block;
  }
`;
document.head.appendChild(style);

export default class LottieAnimationElement extends HTMLElement {
  constructor() {
    super();
    this.renderer = 'svg';
    this.loop = this.hasAttribute('loop');
    this.autoplay = this.hasAttribute('autoplay');
    this.playbackRate = 1;
    this.currentTime = 0;

    this.src = this.getAttribute('src');
  }

  get src() {
    return this._src;
  }

  set src(value) {
    if (value === this._src || !value) {
      return;
    }
    this._src = value;
    if (this.animation) {
      this.animation.destroy();
    }
    const loaderPromise = this._loaderPromise = Loader.load(this._src);
    loaderPromise.then((data) => {
      if (loaderPromise !== this._loaderPromise) {
        return;
      }
      this.animation = lottie.loadAnimation({
        container: this,
        renderer: this.renderer,
        autoplay: this.autoplay,
        animationData: data,
      });
      this.animation.addEventListener('DOMLoaded', () => {
        if (this._segments) {
          this.segments = this._segments;
        }
        this.loop = this._loop;
        this.frameRate = this._frameRate === undefined ? this.animation.frameRate : this._frameRate;
        this.currentTime = this._currentTime;
        this.playbackRate = this._playbackRate;
      });
      this.animation.addEventListener('loopComplete', () => {
        this.dispatchEvent(new Event('ended'));
      });
      this.animation.addEventListener('complete', () => {
        this.dispatchEvent(new Event('ended'));
      });
    });
  }

  play() {
    this.animation.play();
  }

  pause() {
    this.animation.pause();
  }

  set loop(value) {
    this._loop = value;
    if (this.animation) {
      this.animation.loop = value;
    }
  }

  get loop() {
    return this._loop;
  }

  get paused() {
    return this.animation.isPaused;
  }

  set currentTime(value) {
    this._currentTime = value;
    if (this.animation) {
      this.animation[this.paused ? 'goToAndStop' : 'goToAndPlay'](this._currentTime, false);
    }
  }

  get currentTime() {
    return this._currentTime;
  }

  set frameRate(value) {
    this._frameRate = value;
    if (this.animation) {
      this.animation.frameRate = value;
    }
  }

  get frameRate() {
    return this._frameRate;
  }

  set playbackRate(value) {
    this._playbackRate = value;
    if (this.animation) {
      this.animation.setSpeed(Math.abs(value));
      this.animation.setDirection(value);
    }
  }

  get playbackRate() {
    return this._playbackRate;
  }

  set segments(value) {
    this._segments = value;
    if (this.animation) {
      this.animation.playSegments(this._segments, true);
    }
  }

  get segments() {
    return this._segments;
  }
}

window.customElements.define('dlmn-lottie', LottieElement);
