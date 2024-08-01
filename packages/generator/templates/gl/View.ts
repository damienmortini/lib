import { Camera } from '@damienmortini/math';
import { OrbitTransform } from '@damienmortini/orbittransform';
import GLProgram from '@damienmortini/webgl/GLProgram.js';
import GLBoxObject from '@damienmortini/webgl/object/GLBoxObject.js';
import BasicShader from '@damienmortini/webgl/shader/BasicShader.js';

export default class View {
  #canvas;
  #camera;
  #controller;
  #gl;
  #object;

  constructor({ canvas }) {
    this.#canvas = canvas;

    this.#gl = this.#canvas.getContext('webgl2', {
      depth: true,
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.#camera = new Camera();

    this.#controller = new OrbitTransform({
      domElement: this.#canvas,
      matrix: this.#camera.transform,
      distance: 5,
    });

    this.#gl.clearColor(0, 0, 0, 1);
    this.#gl.enable(this.#gl.CULL_FACE);
    this.#gl.enable(this.#gl.DEPTH_TEST);

    this.#object = new GLBoxObject({
      gl: this.#gl,
      normals: true,
      program: new GLProgram({
        gl: this.#gl,
        ...new BasicShader({
          normals: true,
          vertexChunks: [
            [
              'end',
              `
              gl_Position = projectionView * transform * vec4(position, 1.);
            `,
            ],
          ],
          fragmentChunks: [
            [
              'end',
              `
              fragColor = vec4(vNormal * .5 + .5, 1.);
            `,
            ],
          ],
        }),
      }),
    });
  }

  resize(width, height) {
    this.#gl.viewport(0, 0, this.#gl.drawingBufferWidth, this.#gl.drawingBufferHeight);
    this.#camera.aspectRatio = width / height;
    this.update();
  }

  update() {
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);

    this.#controller.update();

    this.#object.draw({
      bind: true,
      uniforms: {
        projectionView: this.#camera.projectionView,
      },
    });
  }
}
