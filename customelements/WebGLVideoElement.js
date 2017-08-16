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
      autoplay: false,
      background: true
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
    this.gl.getExtension("WEBGL_lose_context").loseContext();
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
    this._canvas.width = this._video.videoWidth;
    this._canvas.height = this._video.videoHeight;
  }

  get src() {
    return this._video.src;
  }

  set src(value) {
    this._video.src = value;

    const resizeCanvas = () => {
      this._video.removeEventListener("loadedmetadata", resizeCanvas);
      this.resize();
    }

    this._video.addEventListener("loadedmetadata", resizeCanvas);

    this._video.addEventListener("playing", () => {
      super.play();
    });

    this._video.addEventListener("pause", () => {
      super.pause();
    });
  }

  play() {
    this._video.play();
  }

  pause() {
    this._video.pause();
  }

  addEventListener() {
    this._video.addEventListener(...arguments);
  }

  removeEventListener() {
    this._video.removeEventListener(...arguments);
  }

  set currentTime(value) {
    this._video.currentTime = value;
    this.update();
  }

  get currentTime() {
    return this._video.currentTime;
  }

  set loop(value) {
    this._video.loop = value;
  }

  get loop() {
    return this._video.loop;
  }

  set autoplay(value) {
    this._video.autoplay = value;
  }

  get autoplay() {
    return this._video.autoplay;
  }

  get readyState() {
    return this._video.readyState;
  }

  get duration() {
    return this._video.duration;
  }
}

window.customElements.define("dlib-webglvideo", WebGLVideoElement);
