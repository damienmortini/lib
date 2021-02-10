import Ticker from '../core/util/Ticker.js';

const PAUSED_BY_ACTION = 1;
const PAUSED_BY_INTERSECTION = 2;
const PAUSED_BY_DOCUMENT_VISIBILITY = 4;
const PAUSED_BY_CONNECTION = 8;

/**
 * Element triggering requestAnimationFrame on its update method.
 * @hideconstructor
 */
class AnimationTickerElement extends HTMLElement {
  constructor() {
    super();

    this._updateBound = this.update.bind(this);

    this._pauseFlag = 0;

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

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._pauseFlag |= PAUSED_BY_DOCUMENT_VISIBILITY;
      } else {
        this._pauseFlag &= ~PAUSED_BY_DOCUMENT_VISIBILITY;
      }
    });
  }

  connectedCallback() {
    this._pauseFlag &= ~PAUSED_BY_CONNECTION;
    if (document.hidden) {
      this._pauseFlag |= PAUSED_BY_DOCUMENT_VISIBILITY;
    }
    if (!(this._pauseFlag & PAUSED_BY_ACTION)) {
      this.update();
    }
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
      Ticker.delete(this._updateBound);
    } else {
      Ticker.add(this._updateBound);
    }
  }

  /**
   * Play element.
   */
  play() {
    this._pauseFlag &= ~PAUSED_BY_ACTION;
  }

  /**
   * Pause element.
   */
  pause() {
    this._pauseFlag |= PAUSED_BY_ACTION;
  }

  /**
   * Tells whether the element is paused.
   * @type {Boolean}
   * @readonly
   */
  get paused() {
    return !!this._pauseFlag;
  }

  /**
   * Interface method to extend where to put the code logic.
   */
  update() { }
}

export default AnimationTickerElement;
