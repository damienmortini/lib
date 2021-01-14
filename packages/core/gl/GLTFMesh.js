import GLTFPrimitive from './GLTFPrimitive.js';

export default class GLTFMesh {
  constructor({
    gl,
    data,
  }) {
    this.name = data.name;
    this.weights = data.weights;

    this.primitives = [];
    for (const primitiveData of data.primitives) {
      const primitive = new GLTFPrimitive({
        gl,
        data: primitiveData,
      });
      this.primitives.push(primitive);
    }
  }
}
