import AnimationTickerElement from '@damienmortini/element-animation-ticker/index.js';

import { WebGL1Renderer, WebGLRenderer } from '../../three/src/Three.js';
import Scene from './Scene.js';

window.customElements.define(
  'damo-starter-three',
  class extends AnimationTickerElement {
    constructor() {
      super();

      this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          contain: content;
          width: 300px;
          height: 150px;
        }
        
        canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      </style>
      <canvas></canvas>
    `;

      this.canvas = this.shadowRoot.querySelector('canvas');

      this.renderer = new (/\bforcewebgl1\b/.test(window.location.search) ? WebGL1Renderer : WebGLRenderer)({
        canvas: this.canvas,
        powerPreference: 'high-performance',
        antialias: true,
      });
      this.renderer.setPixelRatio(window.devicePixelRatio);

      this.scene = new Scene({ canvas: this.canvas });

      const resizeObserver = new ResizeObserver((entries) => {
        const width = entries[0].contentRect.width;
        const height = entries[0].contentRect.height;

        this.scene.resize(width, height);
        this.renderer.setSize(width, height, false);
        this.renderer.render(this.scene, this.scene.camera);
      });
      resizeObserver.observe(this.canvas);
    }

    update() {
      this.scene.update();
      this.renderer.render(this.scene, this.scene.camera);
    }
  },
);
