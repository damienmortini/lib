import GLBuffer from '../GLBuffer.js'
import GLGeometry from '../GLGeometry.js'
import GLObject from '../GLObject.js'
import GLVertexAttribute from '../GLVertexAttribute.js'

export default class GLTransformFeedbackObject extends GLObject {
  #geometryIn
  #geometryOut
  #transformFeedbackIn
  #transformFeedbackOut

  constructor({
    gl,
    attributes = {},
    program,
  }) {
    super({
      gl,
      program,
    })

    for (let index = 0; index < 2; index++) {
      const attributesDynamic = new Map()
      const buffers = new Map()
      for (const [name, attribute] of Object.entries(attributes)) {
        const data = attribute.buffer?.data ?? attribute.data
        let buffer = buffers.get(data)
        if (!buffer) {
          buffer = new GLBuffer({
            gl,
            data,
            usage: gl.DYNAMIC_COPY,
          })
          buffers.set(data, buffer)
        }
        attributesDynamic.set(name, new GLVertexAttribute({
          ...attribute,
          gl,
          data: buffer,
        }))
      }

      const transformFeedback = gl.createTransformFeedback()
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback)
      for (const buffer of buffers.values()) {
        buffer.bind({
          target: gl.TRANSFORM_FEEDBACK_BUFFER,
          index: 0,
        })
      }
      if (!index) this.#transformFeedbackIn = transformFeedback
      else this.#transformFeedbackOut = transformFeedback

      const geometry = new GLGeometry({
        gl,
        attributes: attributesDynamic,
      })
      if (!index) this.#geometryIn = geometry
      else this.#geometryOut = geometry

      this.geometry = geometry
    }
  }

  get attributes() {
    return this.#geometryOut.attributes
  }

  draw({
    mode = this.gl.POINTS,
    uniforms = {},
    debug = false,
  } = {}) {
    this.geometry = this.#geometryIn

    if (!debug) this.gl.enable(this.gl.RASTERIZER_DISCARD)

    this.bind()
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, this.#transformFeedbackOut)
    this.gl.beginTransformFeedback(mode)
    super.draw({
      mode,
      uniforms,
    })
    this.gl.endTransformFeedback()
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null)
    this.unbind()

    if (!debug) this.gl.disable(this.gl.RASTERIZER_DISCARD)

    const tmpGeometry = this.#geometryIn
    this.#geometryIn = this.#geometryOut
    this.#geometryOut = tmpGeometry

    const tmpTransformFeedback = this.#transformFeedbackIn
    this.#transformFeedbackIn = this.#transformFeedbackOut
    this.#transformFeedbackOut = tmpTransformFeedback
  }
}
