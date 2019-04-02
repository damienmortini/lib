// Work with https://github.com/soimy/msdf-bmfont-xml

import GLTexture from "../GLTexture.js";
import GLPlaneObject from "./GLPlaneObject.js";
import GLProgram from "../GLProgram.js";
import BasicShader from "../../shader/BasicShader.js";

export default class GLMSDFTextObject extends GLPlaneObject {
  constructor({
    gl,
    fontImage,
    fontData,
    textContent = "",
    fillStyle = "black",
    textAlign = "left",
    verticalAlign = "top",
    maxWidth = Infinity,
    fontSize = 16,
    attributes = {},
    shader = undefined,
  }) {
    const isWebGL1 = gl instanceof WebGLRenderingContext;

    const glyphsData = new Map();
    const uvRectangles = [];
    const sizes = [];
    const fontScale = fontSize / fontData.info.size;

    for (const [index, glyphData] of fontData.chars.entries()) {
      uvRectangles.push([glyphData.x / fontImage.width, glyphData.y / fontImage.height, glyphData.width / fontImage.width, glyphData.height / fontImage.height]);
      sizes.push([glyphData.width, glyphData.height]);
      glyphData._glyphIndex = index;
      glyphsData.set(glyphData.char, glyphData);
    }

    gl.getExtension("OES_standard_derivatives");

    super({
      gl,
      width: 1,
      height: 1,
      uvs: true,
      attributes: Object.assign({
        msdfTextGlyphIndex: {
          data: new (isWebGL1 ? Float32Array : Int8Array)(2),
          size: 1,
          divisor: 1,
        },
        msdfTextGlyphPosition: {
          data: new Float32Array(2),
          size: 2,
          divisor: 1,
        },
      }, attributes),
      program: new GLProgram({
        gl,
        shader: new BasicShader({
          uniforms: {
            msdfTextFontTexture: new GLTexture({
              gl,
              data: fontImage,
              wrapS: gl.CLAMP_TO_EDGE,
              wrapT: gl.CLAMP_TO_EDGE,
              minFilter: gl.LINEAR,
            }),
            msdfFontScale: fontScale,
            msdfTextFontTextureSize: [fontImage.width, fontImage.height],
            msdfTextUVRectangles: uvRectangles,
            msdfTextSizes: sizes,
            msdfTextPixelRange: parseFloat(fontData.distanceField.distanceRange),
          },
          vertexShaderChunks: [
            ["start", `
              uniform vec2 msdfTextSizes[${fontData.chars.length}];
              uniform vec4 msdfTextUVRectangles[${fontData.chars.length}];
              uniform float msdfFontScale;

              ${isWebGL1 ? "in float msdfTextGlyphIndex;" : "in int msdfTextGlyphIndex;"}
              in vec2 msdfTextGlyphPosition;

              out vec2 vMSDFTextPosition;
            `],
            ["main", `
              vec3 position = position;

              position.xy *= msdfTextSizes[int(msdfTextGlyphIndex)] * msdfFontScale;
              position.xy += msdfTextGlyphPosition * msdfFontScale;
            `],
            ["end", `
              vec4 msdfTextUVRectangle = msdfTextUVRectangles[int(msdfTextGlyphIndex)];
              vMSDFTextPosition = vec2(msdfTextUVRectangle.x + msdfTextUVRectangle.z * uv.x, msdfTextUVRectangle.y + msdfTextUVRectangle.w * (1. - uv.y));
            `],
          ],
          fragmentShaderChunks: [
            ["start", `
              uniform sampler2D msdfTextFontTexture;
              uniform float msdfTextPixelRange;
              uniform vec2 msdfTextFontTextureSize;

              in vec2 vMSDFTextPosition;
            `],
            ["end", `
              vec3 msdfTextTexel = texture(msdfTextFontTexture, vMSDFTextPosition).rgb;
              float msdfTextSDF = max(min(msdfTextTexel.r, msdfTextTexel.g), min(max(msdfTextTexel.r, msdfTextTexel.g), msdfTextTexel.b));
              float msdfTextSDFValue = msdfTextSDF - .5;
              msdfTextSDFValue *= dot(msdfTextPixelRange / msdfTextFontTextureSize, .5 / fwidth(vMSDFTextPosition));
              msdfTextSDFValue = clamp(msdfTextSDFValue, 0., 1.);
              fragColor = vec4(vec3(1.), msdfTextSDFValue);
            `],
          ],
          shaders: [shader, {
            fragmentShaderChunks: [
              ["precision highp float;", isWebGL1 ? "#extension GL_OES_standard_derivatives : enable\nprecision highp float;" : "precision highp float;"],
            ],
          }],
        }),
      }),
    });

    this._isWebGL1 = isWebGL1;
    this._glyphsData = glyphsData;
    this._glyphsNumber = 0;
    this._lineHeight = fontData.common.lineHeight;
    this._distanceFieldRange = parseFloat(fontData.distanceField.distanceRange);
    this._fontScale = fontScale;

    this.maxWidth = maxWidth;
    this.textAlign = textAlign;
    this.verticalAlign = verticalAlign;
    this.fillStyle = fillStyle;
    this.textContent = textContent;
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = value;

    const glyphIndexes = new (this._isWebGL1 ? Float32Array : Int8Array)(this._textContent.length);
    const glyphPositions = new Float32Array(this._textContent.length * 2);

    let lineXOffset = 0;
    let lineYOffset = 0;

    let lineLastWordXOffset = 0;
    let lineFirstWordFirstGlyphId = 0;
    let lineLastWordFirstGlyphId = 0;

    let needsLineBreak = false;

    for (let index = 0; index < this._textContent.length; index++) {
      let glyph = this._textContent[index];

      const lineBreak = glyph === "\n";

      if (lineBreak) {
        glyph = " ";
      }

      const glyphData = this._glyphsData.get(glyph);

      glyphIndexes[index] = glyphData._glyphIndex;

      glyphPositions[index * 2] = lineXOffset + glyphData.width * .5 + glyphData.xoffset;
      glyphPositions[index * 2 + 1] = -glyphData.height * .5 - glyphData.yoffset - lineYOffset;

      if ((needsLineBreak || lineXOffset > this.maxWidth / this._fontScale) && lineLastWordFirstGlyphId !== lineFirstWordFirstGlyphId) {
        needsLineBreak = false;
        if (this.textAlign === "center") {
          for (let textAlignIndex = lineFirstWordFirstGlyphId; textAlignIndex < lineLastWordFirstGlyphId; textAlignIndex++) {
            glyphPositions[textAlignIndex * 2] -= lineLastWordXOffset * .5;
          }
        }

        lineXOffset = 0;
        lineYOffset += this._lineHeight;
        index = lineLastWordFirstGlyphId;
        lineFirstWordFirstGlyphId = lineLastWordFirstGlyphId;

        continue;
      }

      if (glyph === " ") {
        lineLastWordXOffset = lineXOffset;
        lineLastWordFirstGlyphId = index;
      }

      lineXOffset += glyphData.xadvance;

      needsLineBreak = lineBreak;
    }

    if (this.textAlign === "center") {
      for (let textAlignIndex = lineFirstWordFirstGlyphId; textAlignIndex < this._textContent.length; textAlignIndex++) {
        glyphPositions[textAlignIndex * 2] -= lineXOffset * .5;
      }
    }

    if (this.verticalAlign === "middle") {
      for (let index = 0; index < glyphPositions.length; index += 2) {
        glyphPositions[index + 1] += lineYOffset * .5 + (this._lineHeight) * .5 + this._distanceFieldRange;
      }
    }

    this.mesh.attributes.get("msdfTextGlyphIndex").data = glyphIndexes;
    this.mesh.attributes.get("msdfTextGlyphPosition").data = glyphPositions;
  }

  draw(options) {
    super.draw(Object.assign({ instanceCount: this._textContent.length }, options));
  }
}
