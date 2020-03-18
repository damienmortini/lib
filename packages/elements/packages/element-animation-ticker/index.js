import Ticker from '../lib/src/util/Ticker.js';

const PAUSED_BY_USER = 1;
const PAUSED_BY_INTERSECTION = 2;
const PAUSED_BY_VISIBILITY = 4;

/**
 * @customElement
 * Element triggering requestAnimationFrame on it's update method.
 */
export default class AnimationTickerElement extends HTMLElement {
  constructor() {
    super();

    this.autoplay = false;

    this._pauseFlag = PAUSED_BY_USER;

    this._updateBinded = this.update.bind(this);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._pauseFlag |= PAUSED_BY_VISIBILITY;
      } else {
        this._pauseFlag &= ~PAUSED_BY_VISIBILITY;
      }
    });
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) {
        this._pauseFlag |= PAUSED_BY_INTERSECTION;
      } else {
        this._pauseFlag &= ~PAUSED_BY_INTERSECTION;
      }
    });
    observer.observe(this);
  }

  connectedCallback() {
    if (this.autoplay) {
      this._pauseFlag &= ~PAUSED_BY_USER;
    }
  }

  disconnectedCallback() {
    Ticker.delete(this._updateBinded);
  }

  get _pauseFlag() {
    return this.__pauseFlag;
  }

  set _pauseFlag(value) {
    if (this.__pauseFlag === value) {
      return;
    }
    this.__pauseFlag = value;
    if (this.__pauseFlag) {
      Ticker.delete(this._updateBinded);
    } else if (!this._paused) {
      Ticker.add(this._updateBinded);
    }
  }

  /**
   * Indicating whether element should automatically play
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
   * Play element animation
   */
  play() {
    this._pauseFlag &= ~PAUSED_BY_USER;
  }

  /**
   * Pause element animation
   */
  pause() {
    this._pauseFlag |= PAUSED_BY_USER;
  }

  /**
   * Tells whether the media element is paused.
   * @type {Boolean}
   * @readonly
   */
  get paused() {
    return !!this._pauseFlag;
  }

  update() { }
}
