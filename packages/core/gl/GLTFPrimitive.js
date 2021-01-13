import GLBuffer from './GLBuffer.js';
import GLMesh from './GLMesh.js';
import GLObject from './GLObject.js';
import GLTFMaterial from './GLTFMaterial.js';
import GLVertexAttribute from './GLVertexAttribute.js';

const ATTRIBUTE_NAME_MAP = new Map([
  ['POSITION', 'position'],
  ['NORMAL', 'normal'],
  ['TEXCOORD_0', 'uv'],
  ['WEIGHTS_0', 'weight'],
  ['JOINTS_0', 'joint'],
]);

const ATTRIBUTE_TYPE_SIZE_MAP = new Map([
  ['SCALAR', 1],
  ['VEC2', 2],
  ['VEC3', 3],
  ['VEC4', 4],
  ['MAT2', 4],
  ['MAT3', 9],
  ['MAT4', 16],
]);

export default class GLTFPrimitive {
  constructor({
    gl,
    data,
  }) {
    this.material = new GLTFMaterial({ gl, skin: !!data.attributes['JOINTS_0'], morphTargetsNumber: data.targets?.length });
    // this.material = data.material ?? new GLTFMaterial({ gl, skin: !!data.attributes['JOINTS_0'], morphTargets: !!data.targets });
    this.attributes = new Map();
    this.indices = null;

    const targetAttributes = new Map();
    if (data.targets) {
      for (let index = 0; index < data.targets.length; index++) {
        const target = data.targets[index];
        if (target.POSITION) targetAttributes.set(`morphTargetPosition${index}`, target.POSITION);
        if (target.NORMAL) targetAttributes.set(`morphTargetNormal${index}`, target.NORMAL);
        if (target.TANGENT) targetAttributes.set(`morphTargetTangent${index}`, target.TANGENT);
      }
    }

    for (const [attributeName, attribute] of [...Object.entries(data.attributes), ...targetAttributes]) {
      this.attributes.set(ATTRIBUTE_NAME_MAP.get(attributeName) ?? attributeName, new GLVertexAttribute({
        gl,
        buffer: new GLBuffer({
          gl,
          data: attribute.bufferView.buffer,
        }),
        size: ATTRIBUTE_TYPE_SIZE_MAP.get(attribute.type),
        type: attribute.componentType,
        stride: attribute.bufferView.byteStride,
        count: attribute.count,
        offset: (attribute.byteOffset || 0) + attribute.bufferView.byteOffset,
      }));
    }

    if (data.indices) {
      this.indices = new GLVertexAttribute({
        gl,
        buffer: new GLBuffer({
          gl,
          data: data.indices.bufferView.buffer,
          target: gl.ELEMENT_ARRAY_BUFFER,
        }),
        type: data.indices.componentType,
        offset: data.indices.bufferView.byteOffset,
        count: data.indices.count,
      });
    }

    this._mesh = new GLMesh({
      gl,
      attributes: this.attributes,
      indices: this.indices,
    });

    this._object = new GLObject({
      gl,
      mesh: this._mesh,
      program: this.material.program,
    });
  }

  draw(...args) {
    this._object.draw(...args);
  }

  updateSkin(skin) {
    this.material.program.use();
    this.material.program.uniforms.set('jointMatricesTexture', skin.jointMatricesTexture);
    this.material.program.uniforms.set('jointMatricesTextureSize', skin.jointMatricesTextureSize);
  }
}
