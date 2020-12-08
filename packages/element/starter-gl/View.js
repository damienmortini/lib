import Camera from '../../@damienmortini/core/3d/Camera.js';
import GLBoxObject from '../../@damienmortini/core/gl/object/GLBoxObject.js';
import TrackballController from '../../@damienmortini/core/3d/controller/TrackballController.js';
import GLProgram from '../../@damienmortini/core/gl/GLProgram.js';
import BasicShader from '../../@damienmortini/core/shader/BasicShader.js';

export default class View {
  constructor({
    canvas,
  }) {
    this.canvas = canvas;

    const webGLOptions = {
      depth: true,
      alpha: false,
      antialias: true,
    };

    if (!/\bforcewebgl1\b/.test(window.location.search)) {
      this.gl = this.canvas.getContext('webgl2', webGLOptions);
    }
    if (!this.gl) {
      this.gl = this.canvas.getContext('webgl', webGLOptions) || this.canvas.getContext('experimental-webgl', webGLOptions);
    }

    this.camera = new Camera();

    this.cameraController = new TrackballController({
      domElement: this.canvas,
      matrix: this.camera.transform,
      distance: 5,
    });

    this.gl.clearColor(0, 0, 0, 1);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.DEPTH_TEST);

    this.object = new GLBoxObject({
      gl: this.gl,
      width: 1,
      height: 1,
      normals: true,
      program: new GLProgram({
        gl: this.gl,
        shader: new BasicShader({
          normals: true,
          fragmentChunks: [
            ['end', `
              fragColor = vec4(vNormal * .5 + .5, 1.);
            `],
          ],
        }),
      }),
    });
  }

  resize(width, height) {
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.camera.aspectRatio = width / height;
    this.update();
  }

  update() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.cameraController.update();

    this.object.draw({
      uniforms: {
        projectionView: this.camera.projectionView,
      },
    });
  }
}
