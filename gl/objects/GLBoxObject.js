import BoxMesh from "../../3d/mesh/BoxMesh.js";
import GLObject from "../GLObject.js";
import GLMesh from "../GLMesh.js";
import GLProgram from "../GLProgram.js";
import BasicShader from "../../shader/BasicShader.js";

export default class GLBoxObject extends GLObject {
  constructor({
    gl,
    width = undefined,
    height = undefined,
    depth = undefined,
    widthSegments = undefined,
    heightSegments = undefined,
    depthSegments = undefined,
    normals = true,
    uvs = true,
    shaders = [],
  } = { gl }) {
    super({
      gl,
      mesh: new GLMesh({
        gl,
        ...new BoxMesh({
          width,
          height,
          depth,
          widthSegments,
          heightSegments,
          depthSegments,
          normals,
          uvs,
        })
      }),
      program: new GLProgram({
        gl,
        shaders: [
          new BasicShader({
            normals: normals,
            uvs: uvs,
          }),
          ...shaders,
        ],
      }),
    });

    this.transform = this.program.uniforms.get("transform");
  }
}
