import Loader from '../core/util/Loader.js';
import '../../lottie-web/build/player/lottie.js';

/**
 * Element to plays Lottie animation
 * @element element-animation-lottie
 * @example
 * <element-animation-lottie src="data.json" autoplay loop></element-animation-lottie>
 */
class LottieAnimationElement extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'renderer', 'loop', 'autoplay', 'playbackrate', 'framerate', 'starttime'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          width: 300px;
          height: 150px;
        }
      </style>
    `;
  }

  _loadSrc() {
    if (this.animation) {
      this.animation.destroy();
    }
    const loaderPromise = this._loaderPromise = Loader.load(this.src);
    loaderPromise.then((data) => {
      if (loaderPromise !== this._loaderPromise) {
        return;
      }
      this.animation = lottie.loadAnimation({
        container: this.shadowRoot,
        renderer: this.renderer,
        autoplay: this.autoplay,
        loop: this.loop,
        animationData: data,
      });
      this.animation.addEventListener('DOMLoaded', () => {
        if (this.segments) {
          this.segments = this.segments;
        }
        this.animation[this.paused ? 'goToAndStop' : 'goToAndPlay'](this.getAttribute('starttime') || 0);
        this.animation.frameRate = this.frameRate;
        this.animation.setSpeed(Math.abs(this.playbackRate));
        this.animation.setDirection(this.playbackRate);
      });
      this.animation.addEventListener('loopComplete', () => {
        this.dispatchEvent(new Event('ended'));
      });
      this.animation.addEventListener('complete', () => {
        this.dispatchEvent(new Event('ended'));
      });
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    switch (name) {
      case 'src':
        this._loadSrc();
        break;
      case 'loop':
        if (this.animation) {
          this.animation.loop = this.loop;
        }
        break;
      case 'framerate':
        if (this.animation) {
          this.animation.frameRate = this.frameRate;
        }
        break;
      case 'playbackrate':
        if (this.animation) {
          this.animation.setSpeed(Math.abs(this.playbackRate));
          this.animation.setDirection(this.playbackRate);
        }
        break;
      case 'starttime':
        if (this.animation) {
          this.animation[this.paused ? 'goToAndStop' : 'goToAndPlay'](Number(newValue), false);
        }
        break;
      case 'segments':
        if (this.animation) {
          this.animation.playSegments(JSON.parse(newValue), true);
        }
        break;
    }
  }

  /**
   * Source of JSON data file
   * @type {String}
   */
  get src() {
    return this.getAttribute('src');
  }

  set src(value) {
    this.setAttribute('src', value);
  }

  /**
   * Tells if animation needs to loop
   * @type {Boolean}
   */
  get loop() {
    return this.hasAttribute('loop');
  }

  set loop(value) {
    if (value) {
      this.setAttribute('loop', '');
    } else {
      this.removeAttribute('loop');
    }
  }

  /**
   * Autoplay animation
   * @type {Boolean}
   */
  get autoplay() {
    return this.hasAttribute('autoplay');
  }

  set autoplay(value) {
    if (value) {
      this.setAttribute('autoplay', '');
    } else {
      this.removeAttribute('autoplay');
    }
  }

  /**
   * Override the frame rate of the original animation
   * @type {Number}
   */
  get frameRate() {
    return Number(this.getAttribute('framerate')) || this.animation.frameRate;
  }

  set frameRate(value) {
    this.setAttribute('framerate', String(value));
  }

  /**
   * Set the playback rate of the animation (1 normal speed, -1 reverse)
   * @type {Number}
   */
  get playbackRate() {
    return Number(this.getAttribute('playbackrate') || 1);
  }

  set playbackRate(value) {
    this.setAttribute('playbackrate', String(value));
  }

  /**
   * Set renderer engine
   * @type {"svg"|"canvas"|"html"}
   */
  get renderer() {
    return this.getAttribute('renderer') || 'svg';
  }

  set renderer(value) {
    this.setAttribute('renderer', value);
  }

  /**
   * Can contain 2 numeric values that will be used as first and last frame of the animation. Or can contain a sequence of arrays each with 2 numeric values.
   * @type {Array}
   */
  get segments() {
    return this._segments;
  }

  set segments(value) {
    this._segments = value;
    if (this.animation) {
      this.animation.playSegments(this._segments, true);
    }
  }

  /**
   * Update animation current time
   * @type {Number}
   */
  get currentTime() {
    return this._currentTime;
  }

  set currentTime(value) {
    this._currentTime = value;
    if (this.animation) {
      this.animation[this.paused ? 'goToAndStop' : 'goToAndPlay'](this._currentTime, false);
    }
  }

  /**
   * Return true if animation is paused
   * @readonly
   * @type {Boolean}
   */
  get paused() {
    return this.animation.isPaused;
  }

  /**
   * Play current animation
   */
  play() {
    this.animation.play();
  }

  /**
   * Pause current animation
   */
  pause() {
    this.animation.pause();
  }
}

export default LottieAnimationElement;

if (!customElements.get('damo-animation-lottie')) {
  customElements.define('damo-animation-lottie', class DamoLottieAnimationElement extends LottieAnimationElement { });
}
