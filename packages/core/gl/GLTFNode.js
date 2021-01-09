import Matrix4 from '../math/Matrix4.js';
import Quaternion from '../math/Quaternion.js';
import BasicShader from '../shader/BasicShader.js';
import DataTextureShader from '../shader/DataTextureShader.js';
import GLObject from './GLObject.js';
import GLProgram from './GLProgram.js';
import GLBoxObject from './object/GLBoxObject.js';

const QUATERNION = new Quaternion();
const MATRIX4 = new Matrix4();

export default class GLTFNode {
  constructor({
    gl,
    data,
  }) {
    this.name = data.name;
    this.transform = new Matrix4();
    this.children = data.children || [];
    this.skin = data.skin;

    if (data.translation) {
      this.transform.translate(data.translation);
    }

    if (data.rotation) {
      QUATERNION.copy(data.rotation);
      MATRIX4.fromQuaternion(QUATERNION);
      this.transform.multiply(MATRIX4);
    }

    if (data.scale) {
      this.transform.scale(data.scale);
    }

    if (data.mesh) {
      this._object = new GLObject({
        gl,
        mesh: data.mesh,
        program: new GLProgram({
          gl,
          shader: new BasicShader({
            normals: true,
            uvs: true,
            uniforms: {
              transform: this.transform,
            },
            vertexChunks: [
              ['start', `
                uniform highp sampler2D jointMatricesTexture;
                uniform vec2 jointMatricesTextureSize;

                in uvec4 joint;
                in vec4 weight;

                flat out uvec4 vJoint;
                out vec4 vWeight;

                ${DataTextureShader.getTextureDataChunkFromUV()}
                ${DataTextureShader.getTextureDataChunkFromIndex()}

                mat4 getJointMatrix(int index, int matrixID) {                  
                  vec4 v1 = getTextureDataChunkFromIndex(jointMatricesTexture, index, 0 + matrixID * 4, 8, jointMatricesTextureSize);
                  vec4 v2 = getTextureDataChunkFromIndex(jointMatricesTexture, index, 1 + matrixID * 4, 8, jointMatricesTextureSize);
                  vec4 v3 = getTextureDataChunkFromIndex(jointMatricesTexture, index, 2 + matrixID * 4, 8, jointMatricesTextureSize);
                  vec4 v4 = getTextureDataChunkFromIndex(jointMatricesTexture, index, 3 + matrixID * 4, 8, jointMatricesTextureSize);
                  mat4 jointMatrix = mat4(v1, v2, v3, v4);
                  return jointMatrix;
                }
              `],
              ['main', `
                vec3 position = position;
                vec3 normal = normal;

                mat4 skinMatrix =
                  weight.x * getJointMatrix(int(joint.x), 0) +
                  weight.y * getJointMatrix(int(joint.y), 0) +
                  weight.z * getJointMatrix(int(joint.z), 0) +
                  weight.w * getJointMatrix(int(joint.w), 0);
                position = (skinMatrix * vec4(position, 1.)).xyz;

                mat4 skinNormalMatrix =
                  weight.x * getJointMatrix(int(joint.x), 1) +
                  weight.y * getJointMatrix(int(joint.y), 1) +
                  weight.z * getJointMatrix(int(joint.z), 1) +
                  weight.w * getJointMatrix(int(joint.w), 1);
                normal = (skinNormalMatrix * vec4(normal, 1.)).xyz;

                vJoint = joint;
                vWeight = weight;
            `],
            ],
            fragmentChunks: [
              ['start', `
                uniform highp sampler2D jointMatricesTexture;
                uniform vec2 jointMatricesTextureSize;

                flat in uvec4 vJoint;
                in vec4 vWeight;
              `],
              ['end', `
                fragColor = vec4(vNormal * .5 + .5, 1.);
                // fragColor = vec4(vUV, 0., 1.);
                // fragColor = .5 + texture(jointMatricesTexture, vUV);
                // fragColor = vec4(jointMatricesTextureSize, 0., 1.);
                // fragColor = vWeight;
                // fragColor = vec4(vJoint);
                // fragColor = vec4(vec3(vJoint.y), 1.);
                // fragColor = vec4(vec3(vJoint.y), 1.);
                // fragColor = vec4(vec3(vWeight.y), 1.);
              `],
            ],
          }),
        }),
      });
    }
    // else {
    //   this._object = new GLBoxObject({
    //     gl,
    //     width: .1,
    //     height: .2,
    //     depth: .1,
    //     normals: true,
    //     program: new GLProgram({
    //       gl,
    //       shader: new BasicShader({
    //         normals: true,
    //         fragmentChunks: [
    //           ['end', `
    //           fragColor = vec4(vNormal * .5 + .5, 1.);
    //         `],
    //         ],
    //       }),
    //     }),
    //   });
    // }
  }

  draw(...args) {
    if (!this._object) return;
    this._object.draw(...args);
  }

  updateSkin() {
    if (!this.skin || !this._object) {
      return;
    }
    this._object.program.use();
    this._object.program.uniforms.set('jointMatrices', this.skin.jointMatrices);
    this._object.program.uniforms.set('jointNormalMatrices', this.skin.jointNormalMatrices);
    this._object.program.uniforms.set('jointMatricesTexture', this.skin.jointMatricesTexture);
    this._object.program.uniforms.set('jointMatricesTextureSize', this.skin.jointMatricesTextureSize);
  }
}
