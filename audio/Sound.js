export default class Sound extends Audio {
  constructor({ src }) {
    super(src);

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
