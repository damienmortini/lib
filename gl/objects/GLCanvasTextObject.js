import GLMesh from "../GLMesh.js";
import GLProgram from "../GLProgram.js";
import GLTexture from "../GLTexture.js";
import Matrix4 from "../../math/Matrix4.js";

export default class GLCanvasTextObject {
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
    paddingPercentageWidth = 0,
    paddingPercentageHeight = 0,
    offsetXPercentage = 0,
    offsetYPercentage = 0,
    textScale = 1,
  }) {
    this.gl = gl;

    this._textScale = textScale;

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

    this.paddingPercentageWidth = paddingPercentageWidth;
    this.paddingPercentageHeight = paddingPercentageHeight;
    this.offsetXPercentage = offsetXPercentage;
    this.offsetYPercentage = offsetYPercentage;

    this.lock = false;

    this._initGL();

    this._update();
  }

  _initGL() {
    this._texture = new GLTexture({
      gl: this.gl,
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
      // TODO: Remove when WebGL2 is supported everywhere
      minFilter: this.gl.LINEAR,
    });

    this.mesh = new GLMesh({
      gl: this.gl,
      attributes: [
        ["position", {
          data: new Float32Array([
            -1, 1,
            -1, -1,
            1, 1,
            1, -1,
          ]),
          size: 2,
        }],
        ["uv", {
          data: new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            1, 1,
          ]),
          size: 2,
        }],
      ],
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

        out vec2 vUV;

        void main() {
          vec2 position = position;
          position *= scaleOffset.xy;
          position += scaleOffset.zw;
          gl_Position = projectionView * transform * vec4(position, 0., 1.);
          vUV = uv;
        }
      `,
      fragmentShader: `#version 300 es
        precision highp float;

        uniform sampler2D textTexture;

        in vec2 vUV;

        out vec4 fragColor;

        void main() {
          fragColor = texture(textTexture, vUV);
        }
      `,
    });
  }

  _update() {
    if (!this._texture || this.lock) {
      return;
    }

    let width = this._context.measureText(this.textContent).width;
    let height = parseFloat(/\b(\d*)px/.exec(this._context.font)[1]);

    const paddingWidth = width * this.paddingPercentageWidth;
    const paddingHeight = height * this.paddingPercentageHeight;

    const offsetX = width * this.offsetXPercentage;
    const offsetY = height * this.offsetYPercentage;

    const shadowOffsetX = this.shadowOffsetX - this.shadowBlur;
    const shadowOffsetY = this.shadowOffsetY - this.shadowBlur;

    width *= (1 + this.paddingPercentageWidth * 2);
    height *= (1 + this.paddingPercentageHeight * 2);

    width += this.shadowBlur * 2 + Math.abs(this.shadowOffsetX);
    height += this.shadowBlur * 2 + Math.abs(this.shadowOffsetY);

    if (this._canvas.width !== width || this._canvas.height !== height) {
      this._canvas.width = width || 1;
      this._canvas.height = height || 1;
      this._context = this._canvas.getContext("2d");
      this._context.font = this.font;
      this._context.fillStyle = this.fillStyle;
      this._context.shadowColor = this.shadowColor;
      this._context.shadowBlur = this.shadowBlur;
      this._context.shadowOffsetX = this.shadowOffsetX;
      this._context.shadowOffsetY = this.shadowOffsetY;
      this._context.textBaseline = "ideographic";
    }

    this._scaleOffset[3] = -shadowOffsetY * .5 * .01;

    if (this.textAlign === "start" || this.textAlign === "left") {
      this._scaleOffset[2] = (this._canvas.width * .5 + Math.min(0, shadowOffsetX)) * .01;
    } else if (this.textAlign === "end" || this.textAlign === "right") {
      this._scaleOffset[2] = (-this._canvas.width * .5 + Math.max(0, shadowOffsetX)) * .01;
    } else {
      this._scaleOffset[2] = shadowOffsetX * .5 * .01;
    }
    this._scaleOffset[0] = this._canvas.width * this._textScale * .01;
    this._scaleOffset[1] = this._canvas.height * this._textScale * .01;

    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.globalAlpha = 0.01;
    this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.globalAlpha = 1;
    this._context.fillText(this._textContent, (shadowOffsetX < 0 ? Math.abs(shadowOffsetX) : 0) + paddingWidth + offsetX, this._canvas.height - (shadowOffsetY > 0 ? Math.abs(shadowOffsetY) : 0) - paddingHeight + offsetY);

    this._texture.data = this._canvas;
    // TODO: Put back when WebGL2 is supported everywhere
    // this._texture.generateMipmap();
  }

  draw({ projectionView = undefined } = {}) {
    this.program.use();
    this.program.attributes.set(this.mesh.attributes);
    if (projectionView) {
      this.program.uniforms.set("projectionView", projectionView);
    }
    this.program.uniforms.set("scaleOffset", this._scaleOffset);
    this.program.uniforms.set("transform", this.transform);
    this._texture.bind();
    this.mesh.draw({
      mode: this.gl.TRIANGLE_STRIP,
      count: 4,
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
}
