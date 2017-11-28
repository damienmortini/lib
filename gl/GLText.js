import GLMesh from "./GLMesh.js";
import GLProgram from "./GLProgram.js";
import GLTexture from "./GLTexture.js";
import Matrix4 from "../math/Matrix4.js";

export default class GLText {
  constructor({
    gl,
    textContent = "",
    font = "100px sans-serif",
    fillStyle = "black",
    textAlign = "start",
    shadowColor = "rgba(0, 0, 0 ,0)",
    shadowBlur = 0,
    shadowOffsetX = 0,
    shadowOffsetY = 0,
    paddingX = 0,
    paddingY = 0,
    scale = 1,
  } = {}) {
    this.gl = gl;

    this._scale = scale;

    this._scaleOffset = [1, 1, 0, 0];

    this._canvas = document.createElement("canvas");
    this._context = this._canvas.getContext("2d");

    this.transform = new Matrix4();

    this.textContent = textContent;
    this.font = font;
    this.fillStyle = fillStyle;
    this.textAlign = textAlign;
    this.shadowColor = shadowColor;
    this.shadowBlur = shadowBlur;
    this.shadowOffsetX = shadowOffsetX;
    this.shadowOffsetY = shadowOffsetY;
    this.paddingX = paddingX;
    this.paddingY = paddingY;

    this._initGL();

    this._update();
  }

  _initGL() {
    this._texture = new GLTexture({
      gl: this.gl,
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
    });

    this._mesh = new GLMesh({
      gl: this.gl,
      attributes: [
        ["position", {
          data: new Float32Array([
            -1, 1,
            -1, -1,
            1, 1,
            1, -1,
          ]),
          size: 2
        }],
        ["uv", {
          data: new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            1, 1,
          ]),
          size: 2
        }]
      ]
    });

    this.program = new GLProgram({
      gl: this.gl,
      uniforms: [
        ["transform", this.transform],
        ["projectionView", new Matrix4()],
        ["scaleOffset", this._scaleOffset],
      ],
      vertexShader: `#version 300 es
        uniform mat4 transform;
        uniform mat4 projectionView;
        uniform vec4 scaleOffset;

        in vec2 position;
        in vec2 uv;

        out vec2 vUv;

        void main() {
          vec2 position = position;
          position *= scaleOffset.xy;
          position += scaleOffset.zw;
          gl_Position = projectionView * transform * vec4(position, 0., 1.);
          vUv = uv;
        }
      `,
      fragmentShader: `#version 300 es
        precision highp float;

        uniform sampler2D textTexture;

        in vec2 vUv;

        out vec4 fragColor;

        void main() {
          fragColor = texture(textTexture, vUv);
        }
      `
    });
  }

  _update() {
    if(!this._texture) {
      return;
    }

    let offsetX = this.shadowOffsetX - this.shadowBlur;
    let offsetY = this.shadowOffsetY - this.shadowBlur;
    
    let width = this._context.measureText(this.textContent).width + this.shadowBlur * 2 + Math.abs(this.shadowOffsetX) + this.paddingX;
    let height = parseFloat(/\b(\d*)px/.exec(this._context.font)[1]) + this.shadowBlur * 2 + Math.abs(this.shadowOffsetY) + this.paddingY;
    if(this._canvas.width !== width || this._canvas.height !== height) {
      this._canvas.width = width;
      this._canvas.height = height;
      this._context = this._canvas.getContext("2d");
      this._context.font = this.font;
      this._context.fillStyle = this.fillStyle;
      this._context.shadowColor = this.shadowColor;
      this._context.shadowBlur = this.shadowBlur;
      this._context.shadowOffsetX = this.shadowOffsetX;
      this._context.shadowOffsetY = this.shadowOffsetY;
      this._context.textBaseline = "ideographic";
    }

    this._scaleOffset[3] = -offsetY * .5 * this._scale * .01;

    if(this.textAlign === "start" || this.textAlign === "left") {
      this._scaleOffset[2] = (this._canvas.width * .5 + Math.min(0, offsetX)) * .01;
    } else if (this.textAlign === "end" || this.textAlign === "right") {
      this._scaleOffset[2] = (-this._canvas.width * .5 + Math.max(0, offsetX)) * .01;
    } else {
      this._scaleOffset[2] = offsetX * .5 * .01;
    }
    this._scaleOffset[0] = this._canvas.width * this._scale * .01;
    this._scaleOffset[1] = this._canvas.height * this._scale * .01;

    this._context.globalAlpha = 0.01;
    this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.globalAlpha = 1;
    this._context.fillText(this._textContent, offsetX < 0 ? Math.abs(offsetX) : 0, this._canvas.height - (offsetY > 0 ? Math.abs(offsetY) : 0));

    this.program.uniforms.set("scaleOffset", this._scaleOffset);

    this._texture.data = this._canvas;
    this._texture.generateMipmap();
  }

  draw({camera} = {}) {
    this.program.use();
    this.program.attributes.set(this._mesh.attributes);
    if(camera) {
      this.program.uniforms.set("projectionView", camera.projectionView);
    }
    this.program.uniforms.set("transform", this.transform);
    this._texture.bind();
    this._mesh.draw({
      mode: this.gl.TRIANGLE_STRIP,
      count: 4
    });
  }

  set textContent(value) {
    this._textContent = value;
    this._update();
  }

  get textContent() {
    return this._textContent;
  }

  set font(value) {
    this._context.font = this._font = value;
    this._update();
  }

  get font() {
    return this._font;
  }

  set fillStyle(value) {
    this._context.fillStyle = this._fillStyle = value;
    this._update();
  }

  get fillStyle() {
    return this._fillStyle;
  }

  set textAlign(value) {
    this._textAlign = value;
    this._update();
  }

  get textAlign() {
    return this._textAlign;
  }

  set shadowColor(value) {
    this._context.shadowColor = this._shadowColor = value;
    this._update();
  }

  get shadowColor() {
    return this._shadowColor;
  }

  set shadowBlur(value) {
    this._context.shadowBlur = this._shadowBlur = value;
    this._update();
  }

  get shadowBlur() {
    return this._shadowBlur;
  }

  set shadowOffsetX(value) {
    this._context.shadowOffsetX = this._shadowOffsetX = value;
    this._update();
  }

  get shadowOffsetX() {
    return this._shadowOffsetX;
  }

  set shadowOffsetY(value) {
    this._context.shadowOffsetY = this._shadowOffsetY = value;
    this._update();
  }

  get shadowOffsetY() {
    return this._shadowOffsetY;
  }
};
