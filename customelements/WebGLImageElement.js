import GLMesh from "../gl/GLMesh.js";
import GLProgram from "../gl/GLProgram.js";
import GLTexture from "../gl/GLTexture.js";

(() => {
  let style = document.createElement("style");
  style.textContent = `
    dlib-webglimage {
      display: block;
      position: relative;
    }
  `;
  document.head.appendChild(style);
})();

export default class WebGLImageElement extends HTMLElement {
  constructor({
    tagName = "img"
  } = {}) {
    super();

    this._resizeBinded = this.resize.bind(this);

    this._data = document.createElement(tagName);
    this._canvas = document.createElement("canvas");
    this._canvas.style.width = "100%";
    this._canvas.style.height = "100%";
    this.appendChild(this._canvas);
    this.gl = this._canvas.getContext("webgl", {
      premultipliedAlpha: false
    });

    this._mesh = new GLMesh({
      gl: this.gl,
      attributes: [
        ["position", {
          data: new Float32Array([
            -1, -1,
            -1, 1,
            1, -1,
            1, 1
          ]),
          size: 2
        }],
        ["uv", {
          data: new Float32Array([
            0, 1,
            0, 0,
            1, 1,
            1, 0
          ]),
          size: 2
        }]
      ]
    });

    this._texture = new GLTexture({
      gl: this.gl
    });
    this._texture.minFilter = this.gl.LINEAR;
    this._texture.wrapS = this._texture.wrapT = this.gl.CLAMP_TO_EDGE;

    this.program = new GLProgram({
      gl: this.gl,
      uniforms: [
        ["data", this._texture]
      ],
      vertexShader: `
        attribute vec2 position;
        attribute vec2 uv;
        varying vec2 vUv;

        void main() {
          gl_Position = vec4(position, 0., 1.);
          vUv = uv;
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform sampler2D data;
        varying vec2 vUv;

        void main() {
          gl_FragColor = texture2D(data, vUv);
        }
      `
    });
    this.program.use();

    this.program.attributes.set(this._mesh.attributes);

    this.src = this.getAttribute("src");
  }

  connectedCallback() {
    window.addEventListener("resize", this._resizeBinded);
  }

  disconnectedCallback() {
    this.gl.getExtension("WEBGL_lose_context").loseContext();
    window.removeEventListener("resize", this._resizeBinded);
  }

  update() {
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this._texture.data = this._data;
    this._mesh.draw({
      mode: this.gl.TRIANGLE_STRIP,
      count: 4
    });
  }

  resize() {
    this._canvas.width = this._data.width;
    this._canvas.height = this._data.height;
    this.update();
  }

  get src() {
    return this._data.src;
  }

  set src(value) {
    this._data.src = value;

    const resizeCanvas = () => {
      this._data.removeEventListener("loadedmetadata", resizeCanvas);
      this.resize();
    }

    this._data.addEventListener("loadedmetadata", resizeCanvas);
  }

  addEventListener() {
    this._data.addEventListener(...arguments);
  }

  removeEventListener() {
    this._data.removeEventListener(...arguments);
  }
}

window.customElements.define("dlib-webglimg", WebGLImageElement);
