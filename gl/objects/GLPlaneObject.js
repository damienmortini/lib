import PlaneMesh from "../../3d/mesh/PlaneMesh.js";
import GLObject from "../GLObject.js";
import GLMesh from "../GLMesh.js";
import GLProgram from "../GLProgram.js";
import BasicShader from "../../shader/BasicShader.js";

export default class GLPlaneObject extends GLObject {
  constructor({
    gl,
    width = 1,
    height = 1,
    columns = 1,
    rows = 1,
    positions = undefined,
    normals = undefined,
    uvs = undefined,
    indices = undefined,
    shaders = [],
  } = { gl }) {
    super({
      gl,
      mesh: new GLMesh({
        gl,
        ...new PlaneMesh({
          width,
          height,
          columns,
          rows,
          positions,
          normals,
          uvs,
          indices,
        })
      }),
      program: new GLProgram({
        gl,
        shaders: [
          new BasicShader({
            normals: !!normals,
            uvs: !!uvs,
          }),
          ...shaders,
        ],
      }),
    });
}
}
