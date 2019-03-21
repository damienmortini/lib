import BoxMesh from "../../3d/mesh/BoxMesh.js";
import GLObject from "../GLObject.js";
import GLMesh from "../GLMesh.js";
import GLProgram from "../GLProgram.js";

export default class GLBoxObject extends GLObject {
  constructor({
    gl,
    width = undefined,
    height = undefined,
    depth = undefined,
    widthSegments = undefined,
    heightSegments = undefined,
    depthSegments = undefined,
    normals = false,
    uvs = false,
    program = new GLProgram({
      gl,
      shader: {
        vertexShaderChunks: [
          ["start", `
            in vec3 position;
          `],
          ["end", `
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
