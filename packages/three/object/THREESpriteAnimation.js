
import THREESprite from './THREESprite.js'

import Signal from '../../core/util/Signal'
import Ticker from '../../core/util/Ticker'

const SPRITESHEETS = new Map()

export default class THREESpriteAnimation extends THREESprite {
  constructor(image, data, animation, {
    speed = 1,
    fps = 25,
    loop = true,
    reverse = false,
    scale = 1,
    autoplay = true,
  } = {}) {
    let animations = SPRITESHEETS.get(data)
    if (!animations) {
      animations = new Map()
      for (const key in data.frames) {
        const match = /(.*?)([0-9]+)[$\.]/.exec(key)
        const animationName = match[1]
        let frames = animations.get(animationName)
        if (!frames) {
          frames = []
          animations.set(animationName, frames)
        }
        const position = parseInt(match[2])
        frames[position - 1] = key
      }
      SPRITESHEETS.set(data, animations)
    }

    super(image, {
      data,
      frame: animations.get(animation)[0],
      scale,
    })

    this.onAnimationEnd = new Signal()

    this._progress = 0
    this._animations = animations

    this.loop = loop
    this.reverse = reverse
    this.speed = speed
    this.fps = fps
    this.animation = animation

    if (autoplay) {
      this.play()
    }
  }

  set animation(value) {
    if (this._animation === value) {
      return
    }
    this._animation = value

    this.update()
  }

  get animation() {
    return this._animation
  }

  play() {
    Ticker.add(this._updateBound = this._updateBound || this.update.bind(this))
  }

  stop() {
    Ticker.delete(this._updateBound)
  }

  set progress(value) {
    if (this._progress === value) {
      return
    }
    const previousProgress = this._progress
    this._progress = value
    if (this.loop) {
      this._progress = ((this._progress % 1) + 1) % 1
    } else {
      this._progress = Math.min(Math.max(this._progress, 0), 1)
      if (previousProgress !== this._progress && (this._progress === 1 && !this.reverse || this._progress === 0 && this.reverse)) {
        this.onAnimationEnd.dispatch()
      }
    }
  }

  get progress() {
    return this._progress
  }

  update() {
    const frames = this._animations.get(this.animation)
    this.progress += (this.speed * (this.fps / 60) * Ticker.timeScale / frames.length) * (this.reverse ? -1 : 1)
    this.frame = frames[Math.round(this._progress * (frames.length - 1))]
  }
}
