import AnimationTickerElement from '../../@damienmortini/element-animation-ticker/index.js';

import { WebGLRenderer } from '../../three/src/renderers/WebGLRenderer.js';

import Scene from './Scene.js';

/**
 * Entry point element
 * @hideconstructor
 * @example
 * <damo-starter-three></damo-starter-three>
 */
export default class THREEStarter extends AnimationTickerElement {
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

    if (window.WebGL2RenderingContext !== undefined && !/\bforcewebgl1\b/.test(window.location.search)) {
      this.renderer = new WebGLRenderer({
        canvas: this.canvas,
        context: this.canvas.getContext('webgl2', {
          alpha: false,
          powerPreference: 'high-performance',
          antialias: true,
        }),
      });
    } else {
      this.renderer = new WebGLRenderer({
        canvas: this.canvas,
        powerPreference: 'high-performance',
        antialias: true,
      });
    }
    if (/\bdev\b/.test(window.location.search)) {
      this.renderer.debug.checkShaderErrors = true;
    }
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
}

window.customElements.define('damo-starter-three', THREEStarter);
