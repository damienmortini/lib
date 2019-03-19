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
    fontSize = 16,
  }) {
    const glyphsData = new Map();
    const uvRectangles = [];
    const sizes = [];
    console.log(fontData);
    
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
          msdfFontScale: fontSize / fontData.info.size,
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
    const glyphIndexAttribute = this.mesh.attributes.get("msdfTextGlyphIndex");
    const glyphIndexes = [];
    const glyphPositionAttribute = this.mesh.attributes.get("msdfTextGlyphPosition");
    const glyphPositions = [];

    let lineXOffset = 0;

    for (const [index, character] of [...this._textContent].entries()) {
      const glyphData = this._glyphsData.get(character);
      console.log(glyphData);

      if (character !== " ") {
        glyphIndexes.push(glyphData._glyphIndex);
        const x = lineXOffset + glyphData.width * .5 + glyphData.xoffset;
        const y = -glyphData.height * .5 - glyphData.yoffset;
        glyphPositions.push(x, y);
        this._glyphsNumber++;
      }
      lineXOffset += glyphData.xadvance;

      if (index === this._textContent.length - 1) {
        if (this.textAlign === "center") {
          for (let index = 0; index < glyphPositions.length; index += 2) {
            glyphPositions[index] -= lineXOffset * .5;
          }
        }

        if (this.verticalAlign === "middle") {
          for (let index = 0; index < glyphPositions.length; index += 2) {
            glyphPositions[index + 1] += this._lineHeight * .5;
          }
        }
      }
    }

    glyphIndexAttribute.data = new Uint8Array(glyphIndexes);
    glyphPositionAttribute.data = new Float32Array(glyphPositions);
  }

  draw(options) {
    super.draw(Object.assign({ instanceCount: this._glyphsNumber }, options));
  }
}
