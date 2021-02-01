import GLPlaneObject from '../core/gl/object/GLPlaneObject.js';
import GLProgram from '../core/gl/GLProgram.js';
import Shader from '../core/3d/Shader.js';

export default class GLSLCanvasElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          touch-action: none;
        }
        
        canvas {
          width: 100%;
          height: 100%;
          max-height: 100%;
        }
      </style>
      <canvas></canvas>
    `;

    this.canvas = this.shadowRoot.querySelector('canvas');

    const webGLOptions = {
      antialias: true,
      premultipliedAlpha: false,
    };

    this.gl = this.canvas.getContext('webgl2', webGLOptions);
    if (!this.gl) {
      this.gl = this.canvas.getContext('webgl', webGLOptions) || this.canvas.getContext('experimental-webgl', webGLOptions);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const height = entries[0].contentRect.height;

      this.canvas.width = width * window.devicePixelRatio;
      this.canvas.height = height * window.devicePixelRatio;

      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.object.program.uniforms.set('glslCanvasSize', [width, height]);
      this.draw();
    });
    resizeObserver.observe(this.canvas);

    this.object = new GLPlaneObject({
      gl: this.gl,
      width: 2,
      height: 2,
    });
    this.object.bind();
  }

  get shader() {
    return this._shader;
  }

  set shader(value) {
    this._shader = value;
    this.object.program = new GLProgram({
      gl: this.gl,
      shader: new Shader({
        uniforms: {
          glslCanvasSize: [this.canvas.width, this.canvas.height],
          ...this._shader.uniforms,
        },
        vertexChunks: [
          ['end', `
            vPosition = position.xy;
            gl_Position = vec4(position, 1.);
          `],
          ...this._shader.vertexChunks ?? [],
          ['start', `
            uniform vec2 glslCanvasSize;
            in vec3 position;
            out vec2 vPosition;
          `],
        ],
        fragmentChunks: [
          ...this._shader.fragmentChunks ?? [],
          ['start', `
            uniform vec2 glslCanvasSize;
            in vec2 vPosition;
          `],
        ],
      }),
    });
    this.object.bind();
    this.draw();
  }

  get uniforms() {
    return this.object.program.uniforms;
  }

  draw(options) {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.object.draw(options);
  }
}

customElements.define('damo-glslcanvas', GLSLCanvasElement);
