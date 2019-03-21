import Shader from "../../3d/Shader.js";
import PlaneMesh from "../../3d/mesh/PlaneMesh.js";
import GLObject from "../GLObject.js";
import GLMesh from "../GLMesh.js";
import GLProgram from "../GLProgram.js";

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
      shader: {
        vertexShaderChunks: [
          ["start", `
            in vec3 position;
          `],
          ["end", `
            gl_Position = vec4(position, 1.);
          `],
        ],
      }
    }),
  }) {
    super({
      gl,
      mesh: new GLMesh(Object.assign({
        gl,
        attributes,
      }, new PlaneMesh({
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
