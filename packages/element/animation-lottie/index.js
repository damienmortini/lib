import '../../lottie-web/build/player/lottie.min.js';

/**
 * Element to plays Lottie animation
 * @element element-animation-lottie
 * @example
 * <element-animation-lottie src="data.json" autoplay loop></element-animation-lottie>
 */
class LottieAnimationElement extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'renderer', 'loop', 'autoplay', 'playbackrate', 'framerate', 'starttime', 'segments'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 300px;
          height: 150px;
        }

        #container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      </style>
      <div id="container"></div>
    `;

    this._container = this.shadowRoot.querySelector(`#container`);
  }

  async _load(src) {
    if (this.animation) {
      this.animation.destroy();
    }
    this.animation = lottie.loadAnimation({
      container: this._container,
      renderer: this.renderer,
      autoplay: this.autoplay,
      loop: this.loop,
      path: src,
    });
    this.animation.addEventListener('DOMLoaded', () => {
      if (this.segments) {
        this.animation.playSegments(this.segments, true);
      }
      this.animation[this.paused ? 'goToAndStop' : 'goToAndPlay'](this.getAttribute('starttime') || 0);
      this.animation.frameRate = this.frameRate;
      this.animation.setSpeed(Math.abs(this.playbackRate));
      this.animation.setDirection(this.playbackRate);
      this.dispatchEvent(new Event('load'));
    });
    this.animation.addEventListener('loopComplete', () => {
      this.dispatchEvent(new Event('ended'));
    });
    this.animation.addEventListener('complete', () => {
      this.dispatchEvent(new Event('ended'));
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    switch (name) {
      case 'src':
        this._load(newValue);
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
          if (this.segments) this.animation.playSegments(this.segments, true);
          else this.animation.resetSegments(true);
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
    this.toggleAttribute('loop', value);
  }

  /**
   * Autoplay animation
   * @type {Boolean}
   */
  get autoplay() {
    return this.hasAttribute('autoplay');
  }

  set autoplay(value) {
    this.toggleAttribute('autoplay', value);
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
    return Number(this.getAttribute('playbackrate')) || 1;
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
    return JSON.parse(this.getAttribute('segments'));
  }

  set segments(value) {
    this.setAttribute('segments', JSON.stringify(value));
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
    return this.animation ? this.animation.isPaused : true;
  }

  /**
   * Play current animation
   */
  play() {
    if (this.animation) {
      this.animation.play();
    }
  }

  /**
   * Pause current animation
   */
  pause() {
    if (this.animation) {
      this.animation.pause();
    }
  }
}

export default LottieAnimationElement;

customElements.define('damo-animation-lottie', LottieAnimationElement);
