export default class GLTFScene {
  constructor({
    data,
  }) {
    this.nodes = data.nodes;

    this._flattenedNodes = new Set();
    this._flattenedNodesWithMesh = new Set();

    const traverse = (children) => {
      for (const child of children) {
        this._flattenedNodes.add(child);
        if (child.mesh) this._flattenedNodesWithMesh.add(child);
        if (child.children) {
          traverse(child.children);
        }
      }
    };

    traverse(this.nodes);
  }

  get flattenedNodes() {
    return this._flattenedNodes;
  }

  get flattenedNodesWithMesh() {
    return this._flattenedNodesWithMesh;
  }

  _traverseAndUpdateTransforms(node) {
    node.updateNormalMatrix();
    for (const child of node.children) {
      if (node.name === undefined || child.skin?.name !== node.name) { // fix for skin matrix applied twice, might need more fine tuning
        child.worldTransform.multiply(node.worldTransform, child.matrix);
      }
      this._traverseAndUpdateTransforms(child);
    }
  }

  updateWorldTransforms() {
    for (const node of this.nodes) {
      node.worldTransform.copy(node.matrix);
      this._traverseAndUpdateTransforms(node);
    }
  }
}
