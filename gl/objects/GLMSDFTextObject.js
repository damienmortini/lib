import GLTexture from "../GLTexture.js";
import GLPlaneObject from "./GLPlaneObject.js";
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
  }) {
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

    super({
      gl,
      width: 1,
      height: 1,
      uvs: true,
      attributes: {
        msdfTextGlyphIndex: {
          data: new Int8Array(2),
          size: 1,
          divisor: 1,
        },
        msdfTextGlyphPosition: {
          data: new Float32Array(2),
          size: 2,
          divisor: 1,
        },
      },
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
          msdfTextUVRectangles: uvRectangles,
          msdfTextSizes: sizes,
          msdfTextPixelRange: parseFloat(fontData.distanceField.distanceRange),
        },
        vertexShaderChunks: [
          ["start", `
            uniform vec2 msdfTextSizes[${fontData.chars.length}];
            uniform float msdfFontScale;

            in int msdfTextGlyphIndex;
            in vec2 msdfTextGlyphPosition;

            flat out int vMSDFTextGlyphIndex;
          `],
          ["main", `
            vec3 position = position;
            position.xy *= msdfTextSizes[msdfTextGlyphIndex] * msdfFontScale;
            position.xy += msdfTextGlyphPosition * msdfFontScale;
          `],
          ["end", `
            vMSDFTextGlyphIndex = msdfTextGlyphIndex;
          `],
        ],
        fragmentShaderChunks: [
          ["start", `
            uniform sampler2D msdfTextFontTexture;
            uniform float msdfTextPixelRange;
            uniform vec4 msdfTextUVRectangles[${fontData.chars.length}];

            flat in int vMSDFTextGlyphIndex;
          `],
          ["end", `
            vec4 msdfTextUVRectangle = msdfTextUVRectangles[vMSDFTextGlyphIndex];
            vec2 msdfTextPosition = vec2(msdfTextUVRectangle.x + msdfTextUVRectangle.z * vUV.x, msdfTextUVRectangle.y + msdfTextUVRectangle.w * (1. - vUV.y));
            vec2 msdfTextUnit = msdfTextPixelRange / vec2(textureSize(msdfTextFontTexture, 0));
            vec3 msdfTextTexel = texture(msdfTextFontTexture, msdfTextPosition).rgb;
            float msdfTextValue = max(min(msdfTextTexel.r, msdfTextTexel.g), min(max(msdfTextTexel.r, msdfTextTexel.g), msdfTextTexel.b)) - .5;
            msdfTextValue *= dot(msdfTextUnit, .5 / fwidth(msdfTextPosition));
            msdfTextValue = clamp(msdfTextValue, 0., 1.);
            fragColor = vec4(vec3(1.), msdfTextValue);
          `],
        ],
      }),
    });

    this._glyphsData = glyphsData;
    this._glyphsNumber = 0;
    this._lineHeight = fontData.common.lineHeight;
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

    const glyphIndexes = new Int8Array(this._textContent.length);
    const glyphPositions = new Float32Array(this._textContent.length * 2);

    let lineXOffset = 0;
    let lineYOffset = 0;

    let linelastWordXOffset = 0;
    let lineFirstWordFirstGlyphId = 0;
    let lineLastWordFirstGlyphId = 0;

    for (let index = 0; index < this._textContent.length; index++) {
      const glyph = this._textContent[index];

      const glyphData = this._glyphsData.get(glyph);

      glyphIndexes[index] = glyphData._glyphIndex;

      glyphPositions[index * 2] = lineXOffset + glyphData.width * .5 + glyphData.xoffset;
      glyphPositions[index * 2 + 1] = -glyphData.height * .5 - glyphData.yoffset - lineYOffset;

      if (lineXOffset > this.maxWidth / this._fontScale && lineLastWordFirstGlyphId !== lineFirstWordFirstGlyphId) {
        if (this.textAlign === "center") {
          for (let textAlignIndex = lineFirstWordFirstGlyphId; textAlignIndex < lineLastWordFirstGlyphId; textAlignIndex++) {
            glyphPositions[textAlignIndex * 2] -= linelastWordXOffset * .5;
          }
        }

        lineXOffset = 0;
        lineYOffset += this._lineHeight;
        index = lineLastWordFirstGlyphId;
        lineFirstWordFirstGlyphId = lineLastWordFirstGlyphId;

        continue;
      }

      if (glyph === " ") {
        linelastWordXOffset = lineXOffset;
        lineLastWordFirstGlyphId = index;
      }

      lineXOffset += glyphData.xadvance;
    }

    if (this.textAlign === "center") {
      for (let textAlignIndex = lineFirstWordFirstGlyphId; textAlignIndex < this._textContent.length; textAlignIndex++) {
        glyphPositions[textAlignIndex * 2] -= lineXOffset * .5;
      }
    }

    if (this.verticalAlign === "middle") {
      for (let index = 0; index < glyphPositions.length; index += 2) {
        glyphPositions[index + 1] += lineYOffset * .5 + this._lineHeight * .5;
      }
    }

    this.mesh.attributes.get("msdfTextGlyphIndex").data = glyphIndexes;
    this.mesh.attributes.get("msdfTextGlyphPosition").data = glyphPositions;
  }

  draw(options) {
    super.draw(Object.assign({ instanceCount: this.textContent.length }, options));
  }
}
