import createTexture2D from "gl-texture2d";

export default class Texture2D {
  constructor(/*
    gl, width, height, [format = gl.RGBA, type = gl.UNSIGNED_BYTE]
    OR
    gl, ImageData/HTMLCanvas/HTMLImage/HTMLVideo[, format, type]
    */) {
    this._stackglTexture2D = createTexture2D(...arguments);
  }

  get gl() {
    return this._stackglTexture2D.gl;
  }

  get webGLTexture() {
    return this._stackglTexture2D.handle;
  }

  get type() {
    return this._stackglTexture2D.type;
  }

  get format() {
    return this._stackglTexture2D.format;
  }

  get width() {
    return this._stackglTexture2D.shape[0];
  }

  set width(value) {
    this._stackglTexture2D.shape = [value, this.height];
  }

  get height() {
    return this._stackglTexture2D.shape[1];
  }

  set height(value) {
    this._stackglTexture2D.shape = [this.width, value];
  }

  set wrap(value) {
    this._stackglTexture2D.wrap = [value, value];
  }

  get wrapS() {
    return this._stackglTexture2D.wrap[0];
  }

  set wrapS(value) {
    this._stackglTexture2D.wrap = [value, this.wrapT];
  }

  get wrapT() {
    return this._stackglTexture2D.wrap[1];
  }

  set wrapT(value) {
    this._stackglTexture2D.wrap = [this.wrapS, value];
  }

  get magFilter() {
    return this._stackglTexture2D.magFilter;
  }

  set magFilter(value) {
    this._stackglTexture2D.magFilter = value;
  }

  get minFilter() {
    return this._stackglTexture2D.minFilter;
  }

  set minFilter(value) {
    this._stackglTexture2D.minFilter = value;
  }

  get mipSamples() {
    return this._stackglTexture2D.mipSamples;
  }

  set mipSamples(value) {
    this._stackglTexture2D.mipSamples = value;
  }


  bind() {
    this._stackglTexture2D.bind();
  }

  dispose() {
    this._stackglTexture2D.dispose();
  }

  generateMipmap() {
    this._stackglTexture2D.generateMipmap();
  }
}
