import GLMesh from '../core/gl/GLMesh.js';
import GLProgram from '../core/gl/GLProgram.js';
import GLTexture from '../core/gl/GLTexture.js';

export default class GLViewElement extends HTMLElement {
  constructor() {
    super();

    this._resizeBound = this.resize.bind(this);

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
      premultipliedAlpha: false,
    };

    this.gl = this.canvas.getContext('webgl2', webGLOptions);
    if (!this.gl) {
      this.gl = this.canvas.getContext('webgl', webGLOptions) || this.canvas.getContext('experimental-webgl', webGLOptions);
    }

    this._mesh = new GLMesh({
      gl: this.gl,
      attributes: [
        ['position', {
          data: new Float32Array([
            -1, -1,
            -1, 1,
            1, -1,
            1, 1,
          ]),
          size: 2,
        }],
      ],
    });

    this.shader = {};
  }

  get shader() {
    return this._shader;
  }

  set shader(value) {
    this._shader = value;
    this._program = new GLProgram({
      gl: this.gl,
      shader: {
        vertex: `#version 300 es
          in vec2 position;

          out vec2 uv;

          void main() {
            gl_Position = vec4(position, 0., 1.);
            uv = position * .5 + .5;
            uv.y = 1. - uv.y;
          }
        `,
        fragment: `#version 300 es
          precision highp float;

          in vec2 uv;

          out vec4 fragColor;

          void main() {
            fragColor = vec4(1.);
          }
        `,
        ...this.shader,
      },
    });
    this._program.attributes.set(this._mesh.attributes);
    for (const [name, type] of this._program.uniformTypes) {
      if (type.startsWith('sampler')) {
        const value = this._program.uniforms.get(name);
        if (value instanceof GLTexture) {
          value.bind({
            unit: this._program.textureUnits.get(name),
          });
        }
      }
    }
  }

  get uniforms() {
    return this._program.uniforms;
  }

  connectedCallback() {
    window.addEventListener('resize', this._resizeBound);
  }

  disconnectedCallback() {
    this.gl.getExtension('WEBGL_lose_context').loseContext();
    window.removeEventListener('resize', this._resizeBound);
  }

  draw() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this._mesh.draw({
      mode: this.gl.TRIANGLE_STRIP,
      count: 4,
    });
  }

  resize() {
    this.canvas.width = this.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.offsetHeight * window.devicePixelRatio;
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.draw();
  }
}

if (!customElements.get('damo-gl-view')) {
  customElements.define('damo-gl-view', class DamoGLViewElement extends GLViewElement { });
}
