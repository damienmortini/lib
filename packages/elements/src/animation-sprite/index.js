import TickerElement from "../utils/TickerElement.js";
import SpriteAnimation from "../../@damienmortini/lib/abstract/SpriteAnimation.js";
import Loader from "../../@damienmortini/lib/utils/Loader.js";

const CACHED_DATA_URL = new Map();

(() => {
  let style = document.createElement("style");
  style.textContent = `
    dlmn-spriteanimation {
      display: block;
      position: relative;
    }
  `;
  document.head.appendChild(style);
})();

window.customElements.define("dlmn-spriteanimation", class SpriteAnimationElement extends TickerElement {
  constructor() {
    super({
      autoplay: false,
    });

    this._autoplay = this.hasAttribute("autoplay");

    this._resizeBinded = this.resize.bind(this);
    this._scale = 1;

    this._sprite = document.createElement("div");
    this._sprite.style.position = "absolute";
    this._sprite.style.width = "100%";
    this._sprite.style.height = "100%";
    this._sprite.style.top = "0";
    this._sprite.style.left = "0";
    this.appendChild(this._sprite);

    this._spriteAnimation = new SpriteAnimation({
      loop: this.hasAttribute("loop"),
      frameRate: this.hasAttribute("framerate") ? parseFloat(this.getAttribute("framerate")) : undefined,
      autoplay: this._autoplay,
    });

    this.src = this.getAttribute("src");
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._resizeBinded);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._resizeBinded);
  }

  play() {
    super.play();
    this._spriteAnimation.play();
  }

  pause() {
    this._spriteAnimation.pause();
  }

  update() {
    this._sprite.style.backgroundPosition = `left ${-this._spriteAnimation.x}px top ${-this._spriteAnimation.y}px`;
    this._sprite.style.width = `${this._spriteAnimation.width}px`;
    this._sprite.style.height = `${this._spriteAnimation.height}px`;
    this._sprite.style.top = "50%";
    this._sprite.style.left = "50%";
    this._sprite.style.transform = `translate(-50%, -50%) translate(${this._spriteAnimation.offsetX * this._scale}px, ${this._spriteAnimation.offsetY * this._scale}px) rotate(${this._spriteAnimation.rotated ? -90 : 0}deg) scale(${this._scale})`;
  }

  resize() {
    this._scale = Math.min(this.offsetWidth / this._spriteAnimation.sourceWidth, this.offsetHeight / this._spriteAnimation.sourceHeight);
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
    return this._spriteAnimation.frameRate;
  }

  set frameRate(value) {
    this._spriteAnimation.frameRate = value;
  }

  get loop() {
    return this._spriteAnimation.loop;
  }

  set loop(value) {
    this._spriteAnimation.loop = value;
  }

  get playbackRate() {
    return this._spriteAnimation.playbackRate;
  }

  set playbackRate(value) {
    this._spriteAnimation.playbackRate = value;
  }

  get src() {
    return this._src;
  }

  set src(value) {
    this._src = value;

    Loader.load(this._src).then((data) => {
      this._spriteAnimation.data = data;
      return Loader.load(`${/(.*[/\\]).*$/.exec(this._src)[1]}${data.meta.image}`);
    })
      .then((image) => {
        // Optimise images decoding
        let dataUrl = CACHED_DATA_URL.get(image);

        if (!dataUrl) {
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          let context = canvas.getContext("2d");
          context.drawImage(image, 0, 0);
          dataUrl = canvas.toDataURL();
          CACHED_DATA_URL.set(image, dataUrl);
        }

        this._sprite.style.backgroundImage = `url(${dataUrl})`;

        this.resize();
        this.update();

        this.dispatchEvent(new Event("load"));
      });
  }
});
