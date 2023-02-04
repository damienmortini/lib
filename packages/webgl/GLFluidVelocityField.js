import { GLProgram, GLShaderTexture, addChunks } from '@damienmortini/webgl'

export class GLFluidVelocityField {
  #inputTexture
  #outputTexture
  gl
  #advectProgram
  #jacobiProgram
  #modifierProgram
  #width = 1
  #height = 1

  constructor({ gl, width, height, fragmentChunks = [] }) {
    this.#width = width
    this.#height = height

    const textureData = {
      gl,
      width: this.#width,
      height: this.#height,
      type: gl.FLOAT,
      internalFormat: gl.RGBA32F,
      format: gl.RGBA,
      autoGenerateMipmap: false,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    }

    this.#inputTexture = new GLShaderTexture(textureData)
    this.#outputTexture = new GLShaderTexture(textureData)

    this.#advectProgram = new GLProgram({
      gl,
      vertex: GLShaderTexture.VERTEX,
      fragment: `#version 300 es
      precision highp float;

      uniform float speed;
      uniform sampler2D inputTexture;
      uniform vec2 viewportSize;
      
      in vec2 vUV;
      
      out vec4 fragColor;
      
      void main() {
        vec2 texelSize = 1. / vec2(textureSize(inputTexture, 0));

        vec4 texel = texture(inputTexture, vUV);
        vec2 velocity = texel.xy;

        vec2 previousUV = vUV - velocity.xy * .016 * texelSize * speed;
        velocity = texture(inputTexture, previousUV).xy;

        fragColor = vec4(velocity, 0., 0.);
      }`,
    })

    this.#jacobiProgram = new GLProgram({
      gl,
      vertex: GLShaderTexture.VERTEX,
      fragment: `#version 300 es
      precision highp float;

      uniform sampler2D x;
      uniform sampler2D b;
      uniform vec2 size;
      uniform float alpha;
      uniform float beta;
      
      in vec2 vUV;
      
      out vec4 fragColor;
      
      void main() {
        vec2 texelSize = 1. / vec2(textureSize(x, 0));
        vec4 left  = texture(x, vUV + vec2(-texelSize.x, 0.));
        vec4 right = texture(x, vUV + vec2(texelSize.x, 0.));
        vec4 down  = texture(x, vUV + vec2(0., -texelSize.y));
        vec4 up    = texture(x, vUV + vec2(0., texelSize.y));

        vec4 self  = texture(b, vUV);
        
        fragColor = (left + right + down + up + alpha * self) / beta;
      }`,
    })

    this.#modifierProgram = new GLProgram({
      gl,
      vertex: GLShaderTexture.VERTEX,
      fragment: addChunks(
        `#version 300 es
      precision highp float;
      
      out vec4 fragColor;
      
      void main() {
        fragColor = texture(inputTexture, vUV);
      }`,
        [
          ...fragmentChunks,
          [
            'start',
            `
          uniform sampler2D inputTexture;
          in vec2 vUV;
        `,
          ],
        ],
      ),
    })
  }

  get width() {
    return this.#width
  }

  set width(value) {
    this.#width = value
    this.#inputTexture.width = this.#width
    this.#outputTexture.width = this.#width
  }

  get height() {
    return this.#height
  }

  set height(value) {
    this.#height = value
    this.#inputTexture.width = this.#height
    this.#outputTexture.width = this.#height
  }

  #swapTextures() {
    const tmp = this.#inputTexture
    this.#inputTexture = this.#outputTexture
    this.#outputTexture = tmp
  }

  get texture() {
    return this.#outputTexture
  }

  draw({ uniforms = {}, jacobiIterations = 5, speed = 1 } = {}) {
    this.#outputTexture.program = this.#advectProgram
    this.#outputTexture.draw({
      uniforms: {
        speed,
        inputTexture: this.#inputTexture,
      },
    })
    this.#swapTextures()

    this.#inputTexture.program = this.#jacobiProgram
    this.#outputTexture.program = this.#jacobiProgram
    const jacobiSpeed = 1
    for (let index = 0; index < jacobiIterations; index++) {
      this.#outputTexture.draw({
        uniforms: {
          x: this.#inputTexture,
          b: this.#inputTexture,
          alpha: 4 / jacobiSpeed,
          beta: (4 / jacobiSpeed) * (1 + jacobiSpeed),
        },
      })
      this.#swapTextures()
    }

    this.#outputTexture.program = this.#modifierProgram
    this.#outputTexture.draw({
      uniforms: {
        inputTexture: this.#inputTexture,
        ...uniforms,
      },
    })
    this.#swapTextures()
  }
}
