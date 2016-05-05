import JSARToolKit from "JSARToolKit";

export default class MarkerTracker {
  constructor(drawable) {
    this.drawable = drawable;

    this._canvas = document.createElement("canvas");
    this._ctx = this._canvas.getContext("2d");

    let width = this.drawable.width || this.drawable.videoWidth;
    let height = this.drawable.height || this.drawable.videoHeight;
    let ratio = height / width;
    if (ratio < 1) {
      this._canvas.width = 512;
      this._canvas.height = ratio * 512;
    } else {
      this._canvas.width = (1 / ratio) * 512;
      this._canvas.height = 512;
    }

    this._pastResults = {};

    this._matResult = new JSARToolKit.NyARTransMatResult();
    this._raster = new JSARToolKit.NyARRgbRaster_Canvas2D(this._canvas);
    this._param = new JSARToolKit.FLARParam(this._canvas.width, this._canvas.height);
    this._detector = new JSARToolKit.FLARSingleIdMarkerDetector(this._param, 80);
    this._detector.setContinueMode(true);
  }

  copyCameraMatrix(perspectiveMatrix, near, far) {
    this._param.copyCameraMatrix(perspectiveMatrix, near, far);
  }

  applyMarkerMatrix(matrix4) {
    this._ctx.drawImage(this.drawable, 0, 0, this._canvas.width, this._canvas.height);
    this._canvas.changed = true;
    let detected = this._detector.detectMarkerLite(this._raster, 170);
    if(detected) {
      this._detector.getTransformMatrix(this._matResult);
      matrix4.elements[0] = -this._matResult.m00;
      matrix4.elements[1] = this._matResult.m10;
      matrix4.elements[2] = -this._matResult.m20;
      matrix4.elements[3] = 0;
      matrix4.elements[4] = -this._matResult.m01;
      matrix4.elements[5] = this._matResult.m11;
      matrix4.elements[6] = -this._matResult.m21;
      matrix4.elements[7] = 0;
      matrix4.elements[8] = this._matResult.m02;
      matrix4.elements[9] = -this._matResult.m12;
      matrix4.elements[10] = this._matResult.m22;
      matrix4.elements[11] = 0;
      matrix4.elements[12] = this._matResult.m03;
      matrix4.elements[13] = -this._matResult.m13;
      matrix4.elements[14] = this._matResult.m23;
      matrix4.elements[15] = 1;
    }
  }
}
