let baseURI = "";

export default class Sound extends Audio {
  static get baseURI() {
    return baseURI;
  }

  static set baseURI(value) {
    baseURI = value;
  }

  constructor({ src }) {
    super(`${Sound.baseURI}${src}`);

    const load = () => {
      window.removeEventListener("click", load);
      const paused = this.paused;
      this.play().then(() => {
        if (paused && !this.autoplay) {
          this.pause();
        }
      });
    };

    window.addEventListener("click", load);
  }

  play() {
    return super.play().catch((error) => {
      console.warn(error);
    });
  }
}
