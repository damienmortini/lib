import BoxMesh from '../../3d/mesh/BoxMesh.js';
import GLObject from '../GLObject.js';
import GLMesh from '../GLMesh.js';
import GLProgram from '../GLProgram.js';

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
      shader: {
        vertexChunks: [
          ['start', `
            in vec3 position;
          `],
          ['end', `
            gl_Position = vec4(position, 1.);
          `],
        ],
      },
    }),
  }) {
    super({
      gl,
      mesh: new GLMesh(Object.assign({
        gl,
        attributes,
      }, new BoxMesh({
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
    });
  }
}
