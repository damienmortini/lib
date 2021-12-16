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
    console.log(program)
    super({
      gl,
      program,
    })

    console.log(attributes)

    for (let index = 0; index < 2; index++) {
      const attributesDynamic = new Map()
      for (const [name, attribute] of Object.entries(attributes)) {
        attributesDynamic.set(name, new GLVertexAttribute({
          ...attribute,
          gl,
          data: new GLBuffer({
            gl,
            data: attribute.buffer?.data ?? attribute.data,
            usage: gl.DYNAMIC_COPY,
            // target: gl.TRANSFORM_FEEDBACK_BUFFER,
          }),
        }))
      }

      const transformFeedback = gl.createTransformFeedback()
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback)
      const buffers = new Set()
      for (const attribute of attributesDynamic.values()) {
        buffers.add(attribute.buffer)
      }
      for (const buffer of buffers) {
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

    // this.geometry = this.#geometryIn

    console.log(this.#geometryIn, this.#geometryOut)

    console.log(program)
  }

  // get geometry() {
  //   const geometry = this.#geometryOut
  //   return geometry
  // }

  // set geometry(value) {
  //   super.geometry = value
  // }

  // get attributes() {
  //   return this.#geometryOut.attributes
  // }

  draw({
    mode = this.gl.POINTS,
    uniforms = {},
  } = {}) {
    this.geometry = this.#geometryIn

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

    const tmpGeometry = this.#geometryIn
    this.#geometryIn = this.#geometryOut
    this.#geometryOut = tmpGeometry

    const tmpTransformFeedback = this.#transformFeedbackIn
    this.#transformFeedbackIn = this.#transformFeedbackOut
    this.#transformFeedbackOut = tmpTransformFeedback
    // [this.#geometryIn, this.#geometryOut] = [this.#geometryOut, this.#geometryIn]
    // [this.#transformFeedbackIn, this.#transformFeedbackOut] = [this.#transformFeedbackOut, this.#transformFeedbackIn]
  }
}
