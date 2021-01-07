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
                uniform int jointInverseBindMatricesTextureWidth;
                uniform int jointInverseBindMatricesTextureHeight;

                in vec4 joint;
                in vec4 weight;

                out vec4 vJoint;
                out vec4 vWeight;

                mat4 getBoneMatrix(const in float i) {
                  float j = i * 4.0;
                  float x = mod(j, float(jointInverseBindMatricesTextureWidth));
                  float y = floor(j / float(jointInverseBindMatricesTextureWidth));
                  float dx = 1.0 / float(jointInverseBindMatricesTextureWidth);
                  float dy = 1.0 / float(jointInverseBindMatricesTextureHeight);
                  y = dy * (y + 0.5);
                  vec4 v1 = texture(jointInverseBindMatricesTexture, vec2(dx * (x + 0.5), y));
                  vec4 v2 = texture(jointInverseBindMatricesTexture, vec2(dx * (x + 1.5), y));
                  vec4 v3 = texture(jointInverseBindMatricesTexture, vec2(dx * (x + 2.5), y));
                  vec4 v4 = texture(jointInverseBindMatricesTexture, vec2(dx * (x + 3.5), y));
                  mat4 bone = mat4(v1, v2, v3, v4);
                  return bone;
                }
              `],
              ['main', `
                mat4 skinMatrix =
                  weight.x * getBoneMatrix(joint.x) +
                  weight.y * getBoneMatrix(joint.y) +
                  weight.z * getBoneMatrix(joint.z) +
                  weight.w * getBoneMatrix(joint.w);
                vec3 position = (skinMatrix * vec4(position, 1.0)).xyz;

                vJoint = joint;
                vWeight = weight;
            `],
            ],
            fragmentChunks: [
              ['start', `
                in vec4 vJoint;
                in vec4 vWeight;
              `],
              ['end', `
                fragColor = vec4(vNormal * .5 + .5, 1.);
                fragColor = vWeight;
              `],
            ],
          }),
        }),
      });
    } else {
      // this.object = new GLBoxObject({
      //   gl,
      //   width: 1,
      //   height: 1,
      //   normals: true,
      //   program: new GLProgram({
      //     gl,
      //     shader: new BasicShader({
      //       normals: true,
      //       fragmentChunks: [
      //         ['end', `
      //         fragColor = vec4(vNormal * .5 + .5, 1.);
      //       `],
      //       ],
      //     }),
      //   }),
      // });
    }
  }

  draw(...args) {
    if (!this._object) return;
    this._object.draw(...args);
  }

  get skin() {
    return this._skin;
  }

  set skin(value) {
    this._skin = value;
    if (this._object) {
      this._object.program.use();
      const m4 = new Matrix4();
      const d = new Float32Array(32);
      d.set(m4);
      d.set(m4, 16);
      this._skin.jointInverseBindMatricesTexture.data = d;
      console.log(d);
      this._object.program.uniforms.set('jointInverseBindMatricesTexture', this._skin.jointInverseBindMatricesTexture);
      this._object.program.uniforms.set('jointInverseBindMatricesTextureWidth', this._skin.jointInverseBindMatricesTexture.width);
      this._object.program.uniforms.set('jointInverseBindMatricesTextureHeight', this._skin.jointInverseBindMatricesTexture.height);
    }
  }
}
