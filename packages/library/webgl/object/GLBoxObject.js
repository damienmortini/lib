import BoxGeometry from '@damienmortini/math/geometry/BoxGeometry.js'
import GLObject from '../GLObject.js'
import GLGeometry from '../GLGeometry.js'
import GLProgram from '../GLProgram.js'
import { addChunks, VERTEX } from '../GLSLShader.js'

export default class GLBoxObject extends GLObject {
  constructor({
    gl,
    width = 1,
    height = 1,
    depth = 1,
    widthSegments = 1,
    heightSegments = 1,
    depthSegments = 1,
    normals = false,
    uvs = false,
    attributes = {},
    program = new GLProgram({
      gl,
      vertex: addChunks(VERTEX,
        ['start', `
      in vec3 position;
    `],
        ['end', `
      gl_Position = vec4(position, 1.);
    `],
      )
    }),
  }) {
    super({
      gl,
      geometry: new GLGeometry(Object.assign({
        gl,
        attributes,
      }, new BoxGeometry({
        width,
        height,
        depth,
        widthSegments,
        heightSegments,
        depthSegments,
        normals,
        uvs,
      }))),
      program,
    })
  }
}
