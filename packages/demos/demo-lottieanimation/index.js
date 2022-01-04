import '@damienmortini/element-animation-lottie/index.js'

export class DemoLottieAnimation extends HTMLElement {
  constructor() {
    super()

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 300px;
          height: 150px;
        }

        damo-animation-lottie {
          width: 100%;
          height: 100%;
        }
      </style>
      <damo-animation-lottie autoplay loop src="node_modules/@damienmortini/demo-lottieanimation/animations/data.json">
      </damo-animation-lottie>
    `
  }
}

window.customElements.define('demo-lottieanimation', DemoLottieAnimation)
