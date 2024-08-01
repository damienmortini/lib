import SpriteAnimation from '@damienmortini/core/abstract/SpriteAnimation.js';
import Loader from '@damienmortini/core/util/Loader.js';

import TickerAnimationElement from '../element-animation-ticker/index.js';

const LOAD_PROMISES = new Map();

const load = async (src) => {
  const loadPromise = LOAD_PROMISES.get(src);
  if (loadPromise) return loadPromise;
  const promise = (async () => {
    const data = await Loader.load(src);
    const image = await Loader.load(`${/(.*[/\\]).*$/.exec(src)[1]}${data.meta.image}`);
    // Optimise images decoding
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const dataUrl = canvas.toDataURL();
    return [data, dataUrl];
  })();
  LOAD_PROMISES.set(src, promise);
  return promise;
};

class SpriteAnimationElement extends TickerAnimationElement {
  static get observedAttributes() {
    return ['src', 'loop', 'playbackrate', 'framerate'];
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
    this._width = 1;
    this._height = 1;

    this._spriteAnimation = new SpriteAnimation();

    const resizeObserver = new ResizeObserver((entries) => {
      this._width = entries[0].contentRect.width;
      this._height = entries[0].contentRect.height;
      this._resize();
    });
    resizeObserver.observe(this);
  }

  get ready() {
    return this._readyPromise;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    switch (name) {
      case 'src':
        this._readyPromise = load(newValue).then(([data, dataUrl]) => {
          this._spriteAnimation.data = data;
          this._sprite.style.backgroundImage = `url(${dataUrl})`;
          this._resize();
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
    }
  }

  update() {
    this._spriteAnimation.update();
    this._sprite.style.backgroundPosition = `left ${-this._spriteAnimation.x}px top ${-this._spriteAnimation.y}px`;
    this._sprite.style.width = `${this._spriteAnimation.width}px`;
    this._sprite.style.height = `${this._spriteAnimation.height}px`;
    this._sprite.style.top = '50%';
    this._sprite.style.left = '50%';
    this._sprite.style.transform = `translate(-50%, -50%) translate(${this._spriteAnimation.offsetX * this._scale}px, ${this._spriteAnimation.offsetY * this._scale}px) rotate(${this._spriteAnimation.rotated ? -90 : 0}deg) scale(${this._scale})`;
  }

  _resize() {
    this._scale = Math.min(this._width / this._spriteAnimation.sourceWidth, this._height / this._spriteAnimation.sourceHeight);
    this.update();
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
    }
    else {
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

customElements.define('damo-animation-sprite', SpriteAnimationElement);

export default SpriteAnimationElement;
