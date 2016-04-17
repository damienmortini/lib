import Ticker from "dlib/utils/Ticker.js";

export default class FaceTracker {
  constructor(input) {
    this.input = input;

    this.tracker = new clm.tracker();
    this.tracker.init(pModel);
    this.tracker.start(this.input);

    this._canvas = document.createElement("canvas");
    this._canvas.width = 512;
    this._canvas.height = 512;
    this._context = this._canvas.getContext("2d");

    // Compute indices
    let cells = pModel.path.vertices.concat([[44, 61, 56], [61, 60, 56], [56, 60, 57], [60, 59, 57], [57, 59, 58], [58, 59, 50]]);
    this._indices = new Int16Array(cells.length * 3);
    for (let i = 0; i < cells.length; i++) {
      let cell = cells[i];
      this._indices[i * 3] = cell[0];
      this._indices[i * 3 + 1] = cell[1];
      this._indices[i * 3 + 2] = cell[2];
    }

    // Compute initial positions
    this._initialPositions = new Float32Array(pModel.shapeModel.meanShape.length * 3);
    for (let i = 0; i < pModel.shapeModel.meanShape.length; i++) {
      let position = pModel.shapeModel.meanShape[i];
      // Normalize values
      let x = (position[0] - 24.381567267455893) / 65.00000000000003 * 2 - 1;
      let y = -(position[1] - 25.17298033285374) / 64.61033114464396 * 2 + 1;
      this._initialPositions[i * 3] = x;
      this._initialPositions[i * 3 + 1] = y;
      this._initialPositions[i * 3 + 2] = 0;
    }

    this._positions = Float32Array.from(this._initialPositions);

    this._lastComputedFrame = -1;
    this._currentFrame = 0;

    Ticker.add(this._update.bind(this));
  }

  get indices() {
    return this._indices;
  }

  get initialPositions() {
    return this._initialPositions;
  }

  get positions() {
    let positions = this.tracker.getCurrentPosition();
    if (positions && this._lastComputedFrame !== this._currentFrame) {
      for (let i = 0; i < positions.length; i++) {
        let position = positions[i];
        this._positions[i * 3] = (position[0] - this.input.width * .5) / this.input.width * 2;
        this._positions[i * 3 + 1] = -(position[1] - this.input.height * .5) / this.input.height * 2;
      }
    }
    this._lastComputedFrame = this._currentFrame;
    return this._positions;
  }

  get mapTexture() {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    for (let i = 0; i < this._indices.length; i += 3) {
      let id0 = this._indices[i] * 3;
      let id1 = this._indices[i + 1] * 3;
      let id2 = this._indices[i + 2] * 3;
      let x0 = (this.initialPositions[id0] * .5 + .5) * this._canvas.width;
      let y0 = (-this.initialPositions[id0 + 1] * .5 + .5) * this._canvas.height;
      let x1 = (this.initialPositions[id1] * .5 + .5) * this._canvas.width;
      let y1 = (-this.initialPositions[id1 + 1] * .5 + .5) * this._canvas.height;
      let x2 = (this.initialPositions[id2] * .5 + .5) * this._canvas.width;
      let y2 = (-this.initialPositions[id2 + 1] * .5 + .5) * this._canvas.height;
      let u0 = (this.positions[id0] * .5 + .5) * this.input.width;
      let v0 = (-this.positions[id0 + 1] * .5 + .5) * this.input.height;
      let u1 = (this.positions[id1] * .5 + .5) * this.input.width;
      let v1 = (-this.positions[id1 + 1] * .5 + .5) * this.input.height;
      let u2 = (this.positions[id2] * .5 + .5) * this.input.width;
      let v2 = (-this.positions[id2 + 1] * .5 + .5) * this.input.height;
      this._drawTexturedTriangle(x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2);
    }
    return this._canvas;
  }

  draw(context) {
    this.tracker.draw(context.canvas);
  }

  _update() {
    this._currentFrame++;
  }

  // http://extremelysatisfactorytotalitarianism.com/blog/?p=2120

  _drawTexturedTriangle(x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
    this._context.beginPath();
    this._context.moveTo(x0, y0);
    this._context.lineTo(x1, y1);
    this._context.lineTo(x2, y2);
    this._context.closePath();

    x1 -= x0;
    y1 -= y0;
    x2 -= x0;
    y2 -= y0;

    u1 -= u0;
    v1 -= v0;
    u2 -= u0;
    v2 -= v0;

    var det = 1 / (u1 * v2 - u2 * v1),

      // linear transformation
      a = (v2 * x1 - v1 * x2) * det,
      b = (v2 * y1 - v1 * y2) * det,
      c = (u1 * x2 - u2 * x1) * det,
      d = (u1 * y2 - u2 * y1) * det,

      // translation
      e = x0 - a * u0 - c * v0,
      f = y0 - b * u0 - d * v0;

    this._context.save();
    this._context.transform(a, b, c, d, e, f);
    this._context.clip();
    this._context.drawImage(this.input, 0, 0);
    this._context.restore();
  }
}
