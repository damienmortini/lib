import PlaneGeometry from '@damienmortini/math/geometry/PlaneGeometry.js'
import GLObject from '../GLObject.js'
import GLGeometry from '../GLGeometry.js'
import GLProgram from '../GLProgram.js'

export default class GLPlaneObject extends GLObject {
  constructor({
    gl,
    width = undefined,
    height = undefined,
    columns = undefined,
    rows = undefined,
    normals = false,
    uvs = false,
    attributes = undefined,
    facingUp = false,
    program = new GLProgram({
      gl,
      vertex: `#version 300 es

      in vec3 position;

      void main() {
        gl_Position = vec4(position, 1.);
      }`,
    }),
  }) {
    super({
      gl,
      geometry: new GLGeometry(Object.assign({
        gl,
        attributes,
      }, new PlaneGeometry({
        width,
        height,
        columns,
        rows,
        normals,
        uvs,
        facingUp,
      }))),
      program,
    })
  }
}
