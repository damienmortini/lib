import GLTFShader from '../../shader/GLTFShader.js';
import GLBuffer from '../GLBuffer.js';
import GLGeometry from '../GLGeometry.js';
import GLObject from '../GLObject.js';
import GLProgram from '../GLProgram.js';
import GLTexture from '../GLTexture.js';
import GLTFNode from '../GLTFNode.js';
import GLVertexAttribute from '../GLVertexAttribute.js';

export default class GLGLTFNodeObject extends GLTFNode {
  constructor({
    gl,
    data,
    program = new GLProgram({
      gl,
      shader: new GLTFShader({
        fragmentChunks: [
          ['end', `
            fragColor = vec4(vNormal * .5 + .5, 1.);
          `],
        ],
      }),
    }),
    skinTexture = new GLTexture({
      gl,
      data: data.skin.jointMatricesData,
      autoGenerateMipmap: false,
      type: gl.FLOAT,
      internalFormat: gl.RGBA32F || gl.RGBA,
      minFilter: gl.NEAREST,
      magFilter: gl.NEAREST,
      width: data.skin.jointMatricesTextureSize[0],
      height: data.skin.jointMatricesTextureSize[1],
      flipY: false,
    }),
  }) {
    super({ data });

    this.gl = gl;
    this.program = program;
    this.primitives = [];

    this._skinTexture = skinTexture;

    for (const primitive of data.mesh.primitives) {
      const vertexAttributes = new Map();
      for (const [attributeName, attribute] of primitive.computedAttributes) {
        vertexAttributes.set(attributeName, new GLVertexAttribute({
          gl: this.gl,
          ...attribute,
          buffer: new GLBuffer({
            gl: this.gl,
            data: attribute.buffer,
          }),
        }));
      }

      if (!vertexAttributes.has('joint')) {
        vertexAttributes.set('joint', new GLVertexAttribute({
          gl: this.gl,
          componentType: this.gl.UNSIGNED_INT,
        }));
      }

      this.primitives.push(new GLObject({
        gl: this.gl,
        geometry: new GLGeometry({
          gl: this.gl,
          attributes: vertexAttributes,
          indices: primitive.indices ? new GLVertexAttribute({
            gl: this.gl,
            ...primitive.indices,
            buffer: new GLBuffer({
              gl: this.gl,
              data: primitive.indices.buffer,
              target: this.gl.ELEMENT_ARRAY_BUFFER,
            }),
          }) : null,
        }),
        program: this.program,
      }));
    }
  }

  draw({ uniforms }) {
    for (const object of this.primitives) {
      object.draw({
        bind: true,
        uniforms: {
          transform: this.worldTransform,
          normalMatrix: this.normalMatrix,
          ...(this.weights ? { morphTargetWeights: this.weights } : null),
          ...(this.skin ? {
            skinned: true,
            jointMatricesTexture: this._skinTexture,
            jointMatricesTextureSize: this.skin.jointMatricesTextureSize,
          } : null),
          ...uniforms,
        },
      });
    }
  }
}
