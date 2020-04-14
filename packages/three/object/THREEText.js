import { Object3D } from '../../../three/src/core/Object3D.js';
import { Mesh } from '../../../three/src/objects/Mesh.js';
import { PlaneGeometry } from '../../../three/src/geometries/PlaneGeometry.js';
import { Texture } from '../../../three/src/textures/Texture.js';
import { LinearFilter } from '../../../three/src/constants.js';

import THREEShaderMaterial from '../material/THREEShaderMaterial.js';

export default class THREEText extends Object3D {
  constructor({
    textContent = '',
    font = '10px sans-serif',
    fillStyle = 'black',
    textAlign = 'start',
    shadowColor = 'rgba(0, 0, 0 ,0)',
    shadowBlur = 0,
    shadowOffsetX = 0,
    shadowOffsetY = 0,
    scale = 1,
    maxWidth = Infinity,
    geometry = new PlaneGeometry(1, 1),
    material = new THREEShaderMaterial({
      type: 'basic',
      transparent: true,
    }),
  } = {}) {
    super();

    this._scale = scale;

    this._canvas = document.createElement('canvas');
    this._context = this._canvas.getContext('2d');

    this._texture = new Texture(this._canvas);

    material.map = this._texture;

    this.textContent = textContent;
    this.font = font;
    this.fillStyle = fillStyle;
    this.textAlign = textAlign;
    this.maxWidth = maxWidth;
    this.shadowColor = shadowColor;
    this.shadowBlur = shadowBlur;
    this.shadowOffsetX = shadowOffsetX;
    this.shadowOffsetY = shadowOffsetY;

    this._mesh = new Mesh(geometry, material);
    this.add(this._mesh);

    this._update();
  }

  _updateContextProperties() {
    this._context.font = this.font;
    this._context.fillStyle = this.fillStyle;
    this._context.shadowColor = this.shadowColor;
    this._context.shadowBlur = this.shadowBlur;
    this._context.shadowOffsetX = this.shadowOffsetX;
    this._context.shadowOffsetY = this.shadowOffsetY;
    this._context.textBaseline = 'top';
  }

  _update() {
    if (!this._mesh) {
      return;
    }

    this._updateContextProperties();

    const shadowOffsetX = this.shadowOffsetX - this.shadowBlur;
    const shadowOffsetY = this.shadowOffsetY - this.shadowBlur;

    const words = this.textContent.split(' ');

    const spaceWidth = this._context.measureText(' ').width;
    const wordsWidth = new Map();
    const lines = [{
      textContent: '',
      width: 0,
    }];
    for (const word of words) {
      if (!wordsWidth.get(word)) {
        wordsWidth.set(word, this._context.measureText(word).width);
      }
    }

    let width = 0;
    let lineNumber = 0;
    for (const word of words) {
      const newWidth = lines[lineNumber].width + wordsWidth.get(word);

      if (newWidth > this.maxWidth) {
        lineNumber++;
        lines[lineNumber] = {
          textContent: word,
          width: wordsWidth.get(word),
        };
      } else {
        if (lines[lineNumber].textContent !== '') {
          lines[lineNumber].textContent += ' ';
        }
        lines[lineNumber].textContent += word;
        lines[lineNumber].width += spaceWidth + wordsWidth.get(word);
      }
      width = Math.max(width, lines[lineNumber].width);
    }

    width += this.shadowBlur * 2 + Math.abs(this.shadowOffsetX);

    const lineHeight = parseFloat(/\b(\d*)px/.exec(this._context.font)[1]);
    let height = lineHeight;
    height *= lines.length;
    height += this.shadowBlur * 2 + Math.abs(this.shadowOffsetY);

    if (this._canvas.width !== width || this._canvas.height !== height) {
      this._canvas.width = width;
      this._canvas.height = height;
      this._updateContextProperties();
    }

    this._mesh.position.y = -shadowOffsetY * .5 * this._scale;

    if (this.textAlign === 'start' || this.textAlign === 'left') {
      this._mesh.position.x = (this._canvas.width * .5 + Math.min(0, shadowOffsetX)) * this._scale;
    } else if (this.textAlign === 'end' || this.textAlign === 'right') {
      this._mesh.position.x = (-this._canvas.width * .5 + Math.max(0, shadowOffsetX)) * this._scale;
    } else {
      this._mesh.position.x = shadowOffsetX * .5 * this._scale;
    }
    this._mesh.scale.x = this._canvas.width * this._scale;
    this._mesh.scale.y = this._canvas.height * this._scale;
    this._context.globalAlpha = 1 / 255;
    this._context.fillRect(0, 0, width, height);
    this._context.globalAlpha = 1;
    for (const [i, line] of lines.entries()) {
      let offsetX;
      switch (this.textAlign) {
        case 'start':
        case 'left':
          offsetX = 0;
          break;
        case 'center':
          offsetX = (width - line.width) * .5;
          break;
        case 'end':
        case 'right':
          offsetX = width - line.width;
          break;
      }
      this._context.fillText(line.textContent, offsetX + (shadowOffsetX < 0 ? Math.abs(shadowOffsetX) : 0), (shadowOffsetY < 0 ? Math.abs(shadowOffsetY) : 0) + lineHeight * i);
    }
    this._texture.needsUpdate = true;
  }

  get material() {
    return this._mesh.material;
  }

  set textContent(value) {
    this._textContent = value;
    this._update();
  }

  get textContent() {
    return this._textContent;
  }

  set font(value) {
    this._context.font = this._font = value;
    this._update();
  }

  get font() {
    return this._font;
  }

  set fillStyle(value) {
    this._context.fillStyle = this._fillStyle = value;
    this._update();
  }

  get fillStyle() {
    return this._fillStyle;
  }

  set textAlign(value) {
    this._textAlign = value;
    this._update();
  }

  get textAlign() {
    return this._textAlign;
  }

  set maxWidth(value) {
    this._maxWidth = value;
    this._update();
  }

  get maxWidth() {
    return this._maxWidth;
  }

  set shadowColor(value) {
    this._context.shadowColor = this._shadowColor = value;
    this._update();
  }

  get shadowColor() {
    return this._shadowColor;
  }

  set shadowBlur(value) {
    this._context.shadowBlur = this._shadowBlur = value;
    this._update();
  }

  get shadowBlur() {
    return this._shadowBlur;
  }

  set shadowOffsetX(value) {
    this._context.shadowOffsetX = this._shadowOffsetX = value;
    this._update();
  }

  get shadowOffsetX() {
    return this._shadowOffsetX;
  }

  set shadowOffsetY(value) {
    this._context.shadowOffsetY = this._shadowOffsetY = value;
    this._update();
  }

  get shadowOffsetY() {
    return this._shadowOffsetY;
  }
}
