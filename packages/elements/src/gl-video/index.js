import GLImageElement from './GLImageElement.js';
import Ticker from '../../@damienmortini/lib/utils/Ticker.js';

const style = document.createElement('style');
style.textContent = `
  dlib-webglvideo {
    display: block;
    position: relative;
  }
`;
document.head.appendChild(style);

export default class GLVideoElement extends GLImageElement {
  constructor() {
    super({
      tagName: 'video',
    });

    this._data.setAttribute('playsinline', 'true');

    this._updateBinded = this.update.bind(this);
    this._playTickerBinded = this._playTicker.bind(this);
    this._pauseTickerBinded = this._pauseTicker.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this._data.addEventListener('playing', this._playTickerBinded);
    this._data.addEventListener('pause', this._pauseTickerBinded);
  }

  disconnectedCallback() {
    this._data.removeEventListener('playing', this._playTickerBinded);
    this._data.removeEventListener('pause', this._pauseTickerBinded);
    super.connectedCallback();
  }

  _playTicker() {
    Ticker.add(this._updateBinded);
  }

  _pauseTicker() {
    Ticker.delete(this._updateBinded);
  }

  play() {
    this._data.play();
  }

  pause() {
    this._data.pause();
  }

  set src(value) {
    this._data.src = value;

    const resizeCanvas = () => {
      this._data.removeEventListener('loadedmetadata', resizeCanvas);
      this.resize();
    };

    this._data.addEventListener('loadedmetadata', resizeCanvas);
  }

  set srcObject(value) {
    this._data.srcObject = value;

    const resizeCanvas = () => {
      this._data.removeEventListener('loadedmetadata', resizeCanvas);
      this.resize();
    };

    this._data.addEventListener('loadedmetadata', resizeCanvas);
  }

  set currentTime(value) {
    this._data.currentTime = value;
    this.update();
  }

  get currentTime() {
    return this._data.currentTime;
  }

  set loop(value) {
    this._data.loop = value;
  }

  get loop() {
    return this._data.loop;
  }

  set autoplay(value) {
    this._data.autoplay = value;
  }

  get autoplay() {
    return this._data.autoplay;
  }

  get readyState() {
    return this._data.readyState;
  }

  get duration() {
    return this._data.duration;
  }
}

window.customElements.define('dlib-gl-video', GLVideoElement);
