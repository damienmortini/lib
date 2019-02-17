import BoxMesh from "../../3d/mesh/BoxMesh.js";
import GLObject from "../GLObject.js";
import GLMesh from "../GLMesh.js";
import GLProgram from "../GLProgram.js";
import BasicShader from "../../shader/BasicShader.js";

export default class GLRayMarchingObject extends GLObject {
  constructor({
    gl,
    sdfObjects = [],
    shaders = [],
  } = { gl }) {
    super({
      gl,
      mesh: new GLMesh({
        gl,
        ...new BoxMesh({
          width: 1,
          height: 1,
          depth: 1,
          widthSegments: 10,
          heightSegments: 10,
          depthSegments: 10,
          normals: false,
          uvs: false,
        })
      }),
      program: new GLProgram({
        gl,
        shaders: [
          new BasicShader({
            normals: false,
            uvs: false,
          }),
          ...shaders,
        ],
      }),
    });

    this.sdfObjects = sdfObjects;

    this.transform = this.program.uniforms.get("transform");
  }

  draw(options) {
    
    super.draw({ ...{ instanceCount: this.sdfObjects.length }, ...options });
  }
}
