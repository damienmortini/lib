export default class FaceTracker {
  constructor(input) {
    this.tracker = new clm.tracker();
    this.tracker.init(pModel);
    this.tracker.start(input);
  }

  get indices() {
    if(!this._indices) {
      let cells = pModel.path.vertices.concat([[44, 61, 56],[61, 60, 56],[56, 60, 57],[60, 59, 57],[57, 59, 58],[58, 59, 50]]);
      this._indices = new Int16Array(cells.length * 3);
      for (let i = 0; i < cells.length; i++) {
        let cell = cells[i];
        this._indices[i * 3] = cell[0];
        this._indices[i * 3 + 1] = cell[1];
        this._indices[i * 3 + 2] = cell[2];
      }
    }
    return this._indices;
  }

  get initialPositions() {
    if(!this._initialPositions) {
      this._initialPositions = new Float32Array(pModel.shapeModel.meanShape.length * 3);
      for (let i = 0; i < pModel.shapeModel.meanShape.length; i++) {
        let position = pModel.shapeModel.meanShape[i];
        let x = (position[0] - 24.381567267455893) / 65.00000000000003 * 2 - 1;
        let y = -(position[1] - 25.17298033285374) / 64.61033114464396 * 2 + 1;
        this._initialPositions[i * 3] = x;
        this._initialPositions[i * 3 + 1] = y;
        this._initialPositions[i * 3 + 2] = 0;
      }
    }
    return this._initialPositions;
  }

  get positions() {
    return this.tracker.getCurrentPosition();
  }

  draw(context) {
    this.tracker.draw(context.canvas);
  }
}
