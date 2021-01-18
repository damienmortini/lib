import PlaneGeometry from '../../3d/geometry/PlaneGeometry.js';
import GLObject from '../GLObject.js';
import GLGeometry from '../GLGeometry.js';
import GLProgram from '../GLProgram.js';
import Shader from '../../3d/Shader.js';

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
    program = new GLProgram({
      gl,
      shader: new Shader({
        vertexChunks: [
          ['start', `
            in vec3 position;
          `],
          ['end', `
            gl_Position = vec4(position, 1.);
          `],
        ],
      }),
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
      }))),
      program,
    });
  }
}
