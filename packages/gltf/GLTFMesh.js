import GLTFPrimitive from './GLTFPrimitive.js';

export default class GLTFMesh {
  constructor({
    data,
  }) {
    this.name = data.name;
    this.weights = data.weights;

    this.primitives = [];
    for (const primitiveData of data.primitives) {
      const primitive = new GLTFPrimitive({
        data: primitiveData,
      });
      this.primitives.push(primitive);
    }
  }
}
