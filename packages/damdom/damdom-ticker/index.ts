import Ticker from '@damienmortini/core/util/Ticker.js'

const PAUSED_BY_ACTION = 1
const PAUSED_BY_INTERSECTION = 2
const PAUSED_BY_DOCUMENT_VISIBILITY = 4
const PAUSED_BY_CONNECTION = 8

/**
 * Element triggering and managing a stable requestAnimationFrame loop.
 * @hideconstructor
 */

class DamdomTickerElement extends HTMLElement {
  #pauseFlagValue = 0
  #callback = () => console.log('DamdomTickerElement.callback needs to be set')

  static get deltaTime() {
    return Ticker.deltaTime
  }

  constructor() {
    super()

    const observer = new IntersectionObserver((entries) => {
      let isIntersecting = false
      for (const entry of entries) {
        if (entry.isIntersecting) {
          isIntersecting = true
        }
      }
      if (isIntersecting) {
        this.#pauseFlag &= ~PAUSED_BY_INTERSECTION
      } else {
        this.#pauseFlag |= PAUSED_BY_INTERSECTION
      }
    })
    observer.observe(this)

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.#pauseFlag |= PAUSED_BY_DOCUMENT_VISIBILITY
      } else {
        this.#pauseFlag &= ~PAUSED_BY_DOCUMENT_VISIBILITY
      }
    })
  }

  connectedCallback() {
    this.#pauseFlag &= ~PAUSED_BY_CONNECTION
    if (document.hidden) {
      this.#pauseFlag |= PAUSED_BY_DOCUMENT_VISIBILITY
    }
    if (!(this.#pauseFlag & PAUSED_BY_ACTION)) {
      this.#callback()
    }
  }

  disconnectedCallback() {
    this.#pauseFlag |= PAUSED_BY_CONNECTION
  }

  get #pauseFlag() {
    return this.#pauseFlagValue
  }

  set #pauseFlag(value) {
    if (this.#pauseFlagValue === value) {
      return
    }
    this.#pauseFlagValue = value
    if (this.#pauseFlagValue) {
      Ticker.delete(this.#callback)
    } else {
      Ticker.add(this.#callback)
    }
  }

  /**
   * Play element.
   */
  play() {
    this.#pauseFlag &= ~PAUSED_BY_ACTION
  }

  /**
   * Pause element.
   */
  pause() {
    this.#pauseFlag |= PAUSED_BY_ACTION
  }

  /**
   * Tells whether the element is paused.
   * @type {Boolean}
   * @readonly
   */
  get paused() {
    return !!this.#pauseFlag
  }

  set callback(value) {
    Ticker.delete(this.#callback)
    this.#callback = value
    if (!this.#pauseFlagValue) Ticker.add(this.#callback)
  }
}

export default DamdomTickerElement
