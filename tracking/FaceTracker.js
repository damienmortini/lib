import "auduno/clmtrackr/js/clm.js";
import "auduno/clmtrackr/js/svmfilter_webgl.js";
import "auduno/clmtrackr/js/svmfilter_fft.js";
import "auduno/clmtrackr/js/mossefilter.js";
import "auduno/clmtrackr/examples/ext_js/left_eye_filter.js";
import "auduno/clmtrackr/examples/ext_js/right_eye_filter.js";
import "auduno/clmtrackr/examples/ext_js/nose_filter.js";
import "auduno/clmtrackr/examples/ext_js/numeric-1.2.6.js";
import "auduno/clmtrackr/examples/ext_js/jsfeat-min.js";
import "auduno/clmtrackr/examples/ext_js/frontalface.js";
import "auduno/clmtrackr/examples/ext_js/mosse.js";
import "auduno/clmtrackr/examples/ext_js/jsfeat_detect.js";
import "auduno/clmtrackr/models/model_pca_20_svm.js";

import Ticker from "../util/Ticker.js";

export default class FaceTracker {
  constructor(input, {width = input.width, height = input.height} = {}) {
    this.input = input;

    this._inputCanvas = document.createElement("canvas");
    this._inputCanvas.width = width;
    this._inputCanvas.height = height;
    this._inputContext = this._inputCanvas.getContext("2d");

    this._mapCanvas = document.createElement("canvas");
    this._mapCanvas.width = 512;
    this._mapCanvas.height = 512;
    this._context = this._mapCanvas.getContext("2d");

    this.tracker = new clm.tracker();
    this.tracker.init(pModel);
    this.tracker.start(this._inputCanvas);

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
    this._initialPositions = new Float32Array(pModel.shapeModel.meanShape.length * 2);
    for (let i = 0; i < pModel.shapeModel.meanShape.length; i++) {
      let position = pModel.shapeModel.meanShape[i];
      // Normalize values
      let x = (position[0] - 24.381567267455893) / 65.00000000000003 * 2 - 1;
      let y = -(position[1] - 25.17298033285374) / 64.61033114464396 * 2 + 1;
      this._initialPositions[i * 2] = x;
      this._initialPositions[i * 2 + 1] = y;
    }

    this._positions = Float32Array.from(this._initialPositions);

    // Compute uvs
    this._uvs = Float32Array.from(this._initialPositions);;
    for (let i = 0; i < this._uvs.length; i++) {
      let uv = this._uvs[i] * .5 + .5;
      this._uvs[i] = i % 2 ? 1 - uv : uv;
    }

    this._lastComputedFrame = -1;
    this._currentFrame = 0;

    Ticker.add(this._updateBinded = this._updateBinded || this._update.bind(this));
  }

  get indices() {
    return this._indices;
  }

  get initialPositions() {
    return this._initialPositions;
  }

  get uvs() {
    return this._uvs;
  }

  get positions() {
    this._inputContext.drawImage(this.input, 0, 0, this._inputCanvas.width, this._inputCanvas.height);
    let positions = this.tracker.getCurrentPosition();
    if (positions && this._lastComputedFrame !== this._currentFrame) {
      for (let i = 0; i < positions.length; i++) {
        let position = positions[i];
        this._positions[i * 2] = -(position[0] - this._inputCanvas.width * .5) / this._inputCanvas.width * 2;
        this._positions[i * 2 + 1] = -(position[1] - this._inputCanvas.height * .5) / this._inputCanvas.height * 2;
      }
    }
    this._lastComputedFrame = this._currentFrame;
    return this._positions;
  }

  get mapTexture() {
    this._context.clearRect(0, 0, this._mapCanvas.width, this._mapCanvas.height);
    for (let i = 0; i < this._indices.length; i += 3) {
      let id0 = this._indices[i] * 2;
      let id1 = this._indices[i + 1] * 2;
      let id2 = this._indices[i + 2] * 2;
      let x0 = (this.initialPositions[id0] * .5 + .5) * this._mapCanvas.width;
      let y0 = (-this.initialPositions[id0 + 1] * .5 + .5) * this._mapCanvas.height;
      let x1 = (this.initialPositions[id1] * .5 + .5) * this._mapCanvas.width;
      let y1 = (-this.initialPositions[id1 + 1] * .5 + .5) * this._mapCanvas.height;
      let x2 = (this.initialPositions[id2] * .5 + .5) * this._mapCanvas.width;
      let y2 = (-this.initialPositions[id2 + 1] * .5 + .5) * this._mapCanvas.height;
      let u0 = (this.positions[id0] * .5 + .5) * this._inputCanvas.width;
      let v0 = (-this.positions[id0 + 1] * .5 + .5) * this._inputCanvas.height;
      let u1 = (this.positions[id1] * .5 + .5) * this._inputCanvas.width;
      let v1 = (-this.positions[id1 + 1] * .5 + .5) * this._inputCanvas.height;
      let u2 = (this.positions[id2] * .5 + .5) * this._inputCanvas.width;
      let v2 = (-this.positions[id2 + 1] * .5 + .5) * this._inputCanvas.height;
      this._drawTexturedTriangle(x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2);
    }
    return this._mapCanvas;
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
    this._context.drawImage(this._inputCanvas, 0, 0);
    this._context.restore();
  }
}
