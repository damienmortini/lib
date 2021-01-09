import Matrix4 from '../math/Matrix4.js';
import Quaternion from '../math/Quaternion.js';
import BasicShader from '../shader/BasicShader.js';
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
            uniforms: {
              transform: this.transform,
            },
            vertexChunks: [
              ['start', `
                uniform highp sampler2D jointInverseBindMatricesTexture;
                uniform mat4 jointMatrices[${this.skin.joints.length}];
                uniform mat4 jointNormalMatrices[${this.skin.joints.length}];
                uniform int jointInverseBindMatricesTextureWidth;
                uniform int jointInverseBindMatricesTextureHeight;

                in uvec4 joint;
                // in vec4 joint;
                in vec4 weight;

                flat out uvec4 vJoint;
                // out vec4 vJoint;
                out vec4 vWeight;

                // mat4 getBoneMatrix(const in float i) {
                //   return jointMatrices[int(i)];

                //   float j = i * 4.0;
                //   float x = mod(j, float(jointInverseBindMatricesTextureWidth));
                //   float y = floor(j / float(jointInverseBindMatricesTextureWidth));
                //   float dx = 1.0 / float(jointInverseBindMatricesTextureWidth);
                //   float dy = 1.0 / float(jointInverseBindMatricesTextureHeight);
                //   y = dy * (y + 0.5);
                //   vec4 v1 = texture(jointInverseBindMatricesTexture, vec2(dx * (x + 0.5), y));
                //   vec4 v2 = texture(jointInverseBindMatricesTexture, vec2(dx * (x + 1.5), y));
                //   vec4 v3 = texture(jointInverseBindMatricesTexture, vec2(dx * (x + 2.5), y));
                //   vec4 v4 = texture(jointInverseBindMatricesTexture, vec2(dx * (x + 3.5), y));
                //   mat4 bone = mat4(v1, v2, v3, v4);
                //   return bone;
                // }
              `],
              ['main', `
                vec3 position = position;
                vec3 normal = normal;

                // mat4 skinMatrix = mat4(1.0, 0.0, 0.0, 0.0,  // 1. column
                //   0.0, 1.0, 0.0, 0.0,  // 2. column
                //   0.0, 0.0, 1.0, 0.0,  // 3. column
                //   0.0, 0.0, 0.0, 1.0);

                mat4 skinMatrix =
                  weight.x * jointMatrices[joint.x] +
                  weight.y * jointMatrices[joint.y] +
                  weight.z * jointMatrices[joint.z] +
                  weight.w * jointMatrices[joint.w];
                position = (skinMatrix * vec4(position, 1.0)).xyz;

                mat4 skinNormalMatrix =
                  weight.x * jointNormalMatrices[joint.x] +
                  weight.y * jointNormalMatrices[joint.y] +
                  weight.z * jointNormalMatrices[joint.z] +
                  weight.w * jointNormalMatrices[joint.w];
                normal = (skinNormalMatrix * vec4(normal, 1.0)).xyz;

                vJoint = joint;
                vWeight = weight;
            `],
            ],
            fragmentChunks: [
              ['start', `
                flat in uvec4 vJoint;
                // in vec4 vJoint;
                in vec4 vWeight;
              `],
              ['end', `
                fragColor = vec4(vNormal * .5 + .5, 1.);
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
    } else {
      this._object = new GLBoxObject({
        gl,
        width: .1,
        height: .2,
        depth: .1,
        normals: true,
        program: new GLProgram({
          gl,
          shader: new BasicShader({
            normals: true,
            fragmentChunks: [
              ['end', `
              fragColor = vec4(vNormal * .5 + .5, 1.);
            `],
            ],
          }),
        }),
      });
    }
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
  }
}
