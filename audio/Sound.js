export default class Sound extends Audio {
  constructor({ src }) {
    super(src);

    const load = () => {
      window.removeEventListener("click", load);
      const play = this.autoplay || !this.paused;
      this.play();
      if (!play) {
        this.pause();
      }
    };

    window.addEventListener("click", load);
  }

  play() {
    return super.play().catch((error) => {
      console.warn(error);
    });
  }
}
