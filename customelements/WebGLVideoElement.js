import LoopElement from "./LoopElement.js";
import Ticker from "../utils/Ticker.js";
import GLMesh from "../gl/GLMesh.js";
import GLProgram from "../gl/GLProgram.js";
import GLTexture from "../gl/GLTexture.js";

(() => {
  let style = document.createElement("style");
  style.textContent = `
    dlib-webglvideo {
      display: block;
      position: relative;
    }
  `;
  document.head.appendChild(style);
})();

export default class WebGLVideoElement extends LoopElement {
  constructor() {
    super({
      autoplay: false
    });

    this._resizeBinded = this.resize.bind(this);

    this._video = document.createElement("video");
    this._video.setAttribute("playsinline", "true");
    this._canvas = document.createElement("canvas");
    this._canvas.style.width = "100%";
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

    this._videoTexture = new GLTexture({
      gl: this.gl
    });
    this._videoTexture.minFilter = this.gl.LINEAR;
    this._videoTexture.wrapS = this._videoTexture.wrapT = this.gl.CLAMP_TO_EDGE;

    this.program = new GLProgram({
      gl: this.gl,
      uniforms: [
        ["video", this._videoTexture]
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

        uniform sampler2D video;
        varying vec2 vUv;

        void main() {
          gl_FragColor = texture2D(video, vUv);
        }
      `
    });
    this.program.use();

    this.program.attributes.set(this._mesh.attributes);

    this.src = this.getAttribute("src");
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._resizeBinded);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._resizeBinded);
  }

  update() {
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this._videoTexture.source = this._video;
    this._mesh.draw({
      mode: this.gl.TRIANGLE_STRIP,
      count: 4
    });
  }

  resize() {
    this._canvas.style.height = `${this._canvas.offsetWidth * this._video.videoHeight / this._video.videoWidth}px`;
    this._canvas.width = Math.min(this._video.videoWidth, this.offsetWidth * window.devicePixelRatio);
    this._canvas.height = Math.min(this._video.videoHeight, this.offsetHeight * window.devicePixelRatio);
  }

  get src() {
    return this._video.src;
  }

  set src(value) {
    this._video.src = value;

    const resizeCanvas = () => {
      this._video.removeEventListener("loadedmetadata", resizeCanvas);
      this.resize();


      //tmp
      this._video.play();
      this.play();
    }

    this._video.addEventListener("loadedmetadata", resizeCanvas);
  }

  set loop(value) {
    this._video.loop = value;
  }

  get loop() {
    return this._video.loop;
  }
}

window.customElements.define("dlib-webglvideo", WebGLVideoElement);
