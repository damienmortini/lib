export default class SelectLassoElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          touch-action: none;
        }

        canvas {
          position: relative;
          pointer-events: none;
          width: 100%;
          height: 100%;
        }
      </style>
      <slot></slot>
      <canvas></canvas>
    `;

    const canvas = this.shadowRoot.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.setLineDash([10, 10]);

    const points = [];

    let animationFrameID;

    const update = () => {
      animationFrameID = requestAnimationFrame(update);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();
      context.setLineDash([10 * window.devicePixelRatio, 10 * window.devicePixelRatio]);
      for (const [index, point] of points.entries()) {
        if (!index) {
          context.moveTo(point[0], point[1]);
        }
        else {
          context.lineTo(point[0], point[1]);
        }
      }
      context.stroke();
    };

    this.addEventListener('pointerdown', (event) => {
      context.beginPath();
      points.push([event.clientX * window.devicePixelRatio, event.clientY * window.devicePixelRatio]);
      update();
    });

    this.addEventListener('pointermove', (event) => {
      if (event.pressure > 0) {
        points.push([event.clientX * window.devicePixelRatio, event.clientY * window.devicePixelRatio]);
      }
    });

    window.addEventListener('pointerup', (event) => {
      cancelAnimationFrame(animationFrameID);
      points.length = 0;
      context.clearRect(0, 0, canvas.width, canvas.height);
    });

    const resizeObserver = new ResizeObserver((entries) => {
      canvas.width = this.offsetWidth * window.devicePixelRatio;
      canvas.height = this.offsetHeight * window.devicePixelRatio;
    });

    resizeObserver.observe(this);
  }
}
