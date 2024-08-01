import '@damienmortini/damdom-lottie/index.js';

export class DemoLottieAnimation extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 300px;
          height: 150px;
        }

        damdom-lottie {
          width: 100%;
          height: 100%;
        }
      </style>
      <damdom-lottie autoplay loop src="node_modules/@damienmortini/demo-lottieanimation/animations/data.json">
      </damdom-lottie>
    `;
  }
}

window.customElements.define('demo-lottieanimation', DemoLottieAnimation);
