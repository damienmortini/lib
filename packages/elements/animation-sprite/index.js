import AnimationTickerElement from '../element-animation-ticker/index.js';
import SpriteAnimation from '../core/abstract/SpriteAnimation.js';
import Loader from '../core/util/Loader.js';

const CACHED_DATA = new Map();

class SpriteAnimationElement extends AnimationTickerElement {
  static get observedAttributes() {
    return ['src', 'loop', 'autoplay', 'playbackrate', 'framerate'];
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }

        #sprite {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      </style>
      <div id="sprite"></div>
    `;

    this._sprite = this.shadowRoot.querySelector('#sprite');

    this._scale = 1;

    this._resizeBinded = this.resize.bind(this);

    this._spriteAnimation = new SpriteAnimation();
  }

  async _loadAndCacheData(newValue) {
    const data = await Loader.load(newValue);
    const image = await Loader.load(`${/(.*[/\\]).*$/.exec(newValue)[1]}${data.meta.image}`);
    // Optimise images decoding
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const dataUrl = canvas.toDataURL();
    CACHED_DATA.set(newValue, {
      data,
      dataUrl,
    });
    return [data, dataUrl];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    switch (name) {
      case 'src':
        const cachedData = CACHED_DATA.get(newValue);
        (cachedData ? Promise.resolve([cachedData.data, cachedData.dataUrl]) : this._loadAndCacheData(newValue)).then(([data, dataUrl]) => {
          this._spriteAnimation.data = data;
          this._sprite.style.backgroundImage = `url(${dataUrl})`;
          this.resize();
          this.update();
          this.dispatchEvent(new Event('load'));
        });
        break;
      case 'playbackrate':
        this._spriteAnimation.playbackRate = this.playbackRate;
        break;
      case 'loop':
        this._spriteAnimation.loop = this.loop;
        break;
      case 'framerate':
        this._spriteAnimation.frameRate = this.frameRate;
        break;
      case 'autoplay':
        if (this.autoplay) {
          this.play();
        }
        break;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._resizeBinded);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._resizeBinded);
    super.disconnectedCallback();
  }

  play() {
    super.play();
    this._spriteAnimation.play();
  }

  pause() {
    this._spriteAnimation.pause();
    super.pause();
  }

  update() {
    this._sprite.style.backgroundPosition = `left ${-this._spriteAnimation.x}px top ${-this._spriteAnimation.y}px`;
    this._sprite.style.width = `${this._spriteAnimation.width}px`;
    this._sprite.style.height = `${this._spriteAnimation.height}px`;
    this._sprite.style.top = '50%';
    this._sprite.style.left = '50%';
    this._sprite.style.transform = `translate(-50%, -50%) translate(${this._spriteAnimation.offsetX * this._scale}px, ${this._spriteAnimation.offsetY * this._scale}px) rotate(${this._spriteAnimation.rotated ? -90 : 0}deg) scale(${this._scale})`;
  }

  resize() {
    this._scale = Math.min(this.offsetWidth / this._spriteAnimation.sourceWidth, this.offsetHeight / this._spriteAnimation.sourceHeight);
    this.update();
  }

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

  get duration() {
    return this._spriteAnimation.duration;
  }

  get currentTime() {
    return this._spriteAnimation.currentTime;
  }

  set currentTime(value) {
    this._spriteAnimation.currentTime = value;
    this.update();
  }

  get frameRate() {
    return Number(this.getAttribute('framerate'));
  }

  set frameRate(value) {
    this.setAttribute('framerate', String(value));
  }

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

  get playbackRate() {
    return Number(this.getAttribute('playbackrate'));
  }

  set playbackRate(value) {
    this.setAttribute('playbackrate', String(value));
  }

  get src() {
    return this.getAttribute('src');
  }

  set src(value) {
    this.setAttribute('src', value);
  }
}

export default SpriteAnimationElement;

if (!customElements.get('damo-animation-sprite')) {
  customElements.define('damo-animation-sprite', class DamoSpriteAnimationElement extends SpriteAnimationElement { });
}
