import Ticker from '../lib/src/util/Ticker.js';

const PAUSED_BY_USER = 1;
const PAUSED_BY_INTERSECTION = 2;
const PAUSED_BY_VISIBILITY = 4;
const PAUSED_BY_BLUR = 8;
const PAUSED_BY_CONNECTION = 16;

/**
 * @customElement
 * Element triggering requestAnimationFrame on it's update method.
 */
export default class AnimationTickerElement extends HTMLElement {
  constructor() {
    super();

    this.noautoplay = false;

    this._updateBinded = this.update.bind(this);

    this._pauseFlag = 0;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._pauseFlag |= PAUSED_BY_VISIBILITY;
      } else {
        this._pauseFlag &= ~PAUSED_BY_VISIBILITY;
      }
    });
    const observer = new IntersectionObserver((entries) => {
      let isIntersecting = false;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          isIntersecting = true;
        }
      }
      if (isIntersecting) {
        this._pauseFlag &= ~PAUSED_BY_INTERSECTION;
      } else {
        this._pauseFlag |= PAUSED_BY_INTERSECTION;
      }
    });
    observer.observe(this);

    window.addEventListener('blur', () => {
      this._pauseFlag |= PAUSED_BY_BLUR;
    });
    window.addEventListener('focus', () => {
      this._pauseFlag &= ~PAUSED_BY_BLUR;
    });
  }

  connectedCallback() {
    this._pauseFlag &= ~PAUSED_BY_CONNECTION;
    if (!document.hasFocus()) {
      this._pauseFlag |= PAUSED_BY_BLUR;
    }
    if (this.noautoplay) {
      this._pauseFlag |= PAUSED_BY_USER;
    }
    this.update();
  }

  disconnectedCallback() {
    this._pauseFlag |= PAUSED_BY_CONNECTION;
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
    } else {
      Ticker.add(this._updateBinded);
    }
  }

  /**
   * Indicating whether element should automatically play
   * @type {Boolean}
   */
  get noautoplay() {
    return this.hasAttribute('noautoplay');
  }

  set noautoplay(value) {
    if (value) {
      this.setAttribute('noautoplay', '');
    } else {
      this.removeAttribute('noautoplay');
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
