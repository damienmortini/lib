import Ticker from '../../core/util/Ticker.js'

let baseURI = ''
let muted = false

const audioContext = new (window.AudioContext || window.webkitAudioContext)()

const mainGainNode = audioContext.createGain()
mainGainNode.connect(audioContext.destination)

window.addEventListener('pointerup', () => {
  if (audioContext.state !== 'running') audioContext.resume()
})

export default class Sound {
  static get baseURI() {
    return baseURI
  }

  static set baseURI(value) {
    baseURI = value
  }

  static get muted() {
    return muted
  }

  static set muted(value) {
    muted = value
    mainGainNode.gain.value = muted ? 0 : 1
  }

  constructor({ src }) {
    this.paused = true
    this.allowMultiplePlayback = false

    this._startTime = 0
    this._currentTime = 0

    this._gainNode = audioContext.createGain()
    this._gainNode.connect(mainGainNode)

    this._updateBound = this._update.bind(this)

    this.ready = this._load({ src: `${Sound.baseURI}${src}` })
  }

  async _load({ src }) {
    const audioArrayBuffer = await fetch(src).then((response) => response.arrayBuffer())
    const audioBuffer = await new Promise((resolve) => audioContext.decodeAudioData(audioArrayBuffer, (data) => resolve(data)))
    this._buffer = audioBuffer
    if (!this.paused || this.autoplay) this.play()
  }

  play() {
    this.paused = false
    if (!this._buffer) return
    if (!this.allowMultiplePlayback || this._startTime === audioContext.currentTime) {
      this._source?.stop()
    }
    this._source = audioContext.createBufferSource()
    this._source.buffer = this._buffer
    this._source.connect(this._gainNode)
    this._source.loop = this.loop
    this._startTime = audioContext.currentTime
    this._source.start(0, this._currentTime)
    Ticker.add(this._updateBound)
  }

  pause() {
    Ticker.delete(this._updateBound)
    this.paused = true
    this._source?.stop()
  }

  get duration() {
    return this._buffer?.duration ?? 0
  }

  get autoplay() {
    return this._autoplay
  }

  set autoplay(value) {
    if (this._autoplay === value) return
    this._autoplay = value
    if (this._autoplay) this.play()
  }

  get currentTime() {
    return this._currentTime
  }

  set currentTime(value) {
    this._currentTime = value
    if (!this.paused) this.play()
  }

  get loop() {
    return this._loop
  }

  set loop(value) {
    this._loop = value
    if (this._source) this._source.loop = this._loop
  }

  get volume() {
    return this._gainNode.gain.value
  }

  set volume(value) {
    this._gainNode.gain.value = value
  }

  _update() {
    this._currentTime = (audioContext.currentTime - this._startTime) % this.duration
  }
}
