let baseURI = '';

export default class Sound extends Audio {
  static get baseURI() {
    return baseURI;
  }

  static set baseURI(value) {
    baseURI = value;
  }

  constructor({ src }) {
    if (src instanceof Array) {
      super();
      for (const url of src) {
        const source = document.createElement('source');
        source.src = `${Sound.baseURI}${url}`;
        this.appendChild(source);
      }
    } else {
      super(`${Sound.baseURI}${src}`);
    }

    const load = () => {
      const paused = this.paused;
      this.play().then(() => {
        if (paused && !this.autoplay) {
          this.pause();
        }
      });
    };

    window.addEventListener('pointerup', load, { once: true });
  }

  play() {
    return super.play().catch((error) => {
      console.warn(error);
    });
  }
}
