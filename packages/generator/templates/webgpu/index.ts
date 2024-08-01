import { DamdomTickerElement } from '@damienmortini/damdom-ticker';
import { BoxGeometry, Camera } from '@damienmortini/math';
import { TrackballTransform } from '@damienmortini/trackballtransform';

class TemplateElement extends DamdomTickerElement {
  ready: Promise<void>;

  #canvas: HTMLCanvasElement;
  #device: GPUDevice;
  #context: GPUCanvasContext;
  #gpuPreferredCanvasFormat: GPUTextureFormat;
  #camera: Camera;
  #cameraTransform: TrackballTransform;
  #projectionBuffer: GPUBuffer;
  #vertexBuffer: GPUBuffer;
  #indexBuffer: GPUBuffer;
  #pipeline: GPURenderPipeline;
  #frameBindGroup: GPUBindGroup;
  #msaaTexture: GPUTexture;
  #msaaView: GPUTextureView;
  #depthTexture: GPUTexture;
  #depthView: GPUTextureView;

  constructor() {
    super();

    this.pause();

    this.callback = this.#update;

    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          contain: content;
          width: 300px;
          height: 150px;
        }
        
        canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      </style>
      <canvas></canvas>
    `;

    this.#canvas = this.shadowRoot.querySelector('canvas');

    this.ready = this.#setup();
  }

  async #setup() {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });
    this.#device = await adapter.requestDevice();

    this.#context = this.#canvas.getContext('webgpu');

    this.#gpuPreferredCanvasFormat = navigator.gpu.getPreferredCanvasFormat();

    this.#context.configure({
      device: this.#device,
      format: this.#gpuPreferredCanvasFormat,
    });

    const boxGeometry = new BoxGeometry({
      width: 1,
      height: 1,
      depth: 1,
    });

    this.#camera = new Camera();

    this.#cameraTransform = new TrackballTransform({
      domElement: this.#canvas,
      matrix: this.#camera.transform,
      distance: 5,
    });

    this.#projectionBuffer = this.#device.createBuffer({
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.#device.queue.writeBuffer(this.#projectionBuffer, 0, this.#camera.projectionView);

    const vertexData = new Float32Array(boxGeometry.positions.length + boxGeometry.normals.length);
    for (let i = 0, j = 0; i < boxGeometry.positions.length; i += 3, j += 6) {
      vertexData[j] = boxGeometry.positions[i];
      vertexData[j + 1] = boxGeometry.positions[i + 1];
      vertexData[j + 2] = boxGeometry.positions[i + 2];
      vertexData[j + 3] = boxGeometry.normals[i];
      vertexData[j + 4] = boxGeometry.normals[i + 1];
      vertexData[j + 5] = boxGeometry.normals[i + 2];
    }

    this.#vertexBuffer = this.#device.createBuffer({
      label: 'Vertex Buffer',
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.#device.queue.writeBuffer(this.#vertexBuffer, 0, vertexData);

    this.#indexBuffer = this.#device.createBuffer({
      size: boxGeometry.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.#device.queue.writeBuffer(this.#indexBuffer, 0, boxGeometry.indices);

    const shaderModule = this.#device.createShaderModule({
      code: `
        @group(0) @binding(0) var<uniform> projectionViewMatrix : mat4x4<f32>;

        struct VertexOutput {
          @builtin(position) position : vec4<f32>,
          @location(0) normal : vec3<f32>,
        }

        @vertex
        fn vertexMain(@location(0) position : vec3<f32>, @location(1) normal: vec3<f32>) -> VertexOutput {
          var output : VertexOutput;
          output.position = projectionViewMatrix * vec4<f32>(position, 1.0);
          output.normal = normal;
          return output;
        }

        @fragment
        fn fragmentMain(vertexOutput: VertexOutput) -> @location(0) vec4<f32> {
          return vec4<f32>(vertexOutput.normal * .5 + .5, 1.0);
        }
      `,
    });

    this.#pipeline = await this.#device.createRenderPipelineAsync({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: 4 * 3 + 4 * 3,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3',
              },
              {
                shaderLocation: 1,
                offset: 4 * 3,
                format: 'float32x3',
              },
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [
          {
            format: this.#gpuPreferredCanvasFormat,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      multisample: {
        count: 4,
      },
    });

    this.#frameBindGroup = this.#device.createBindGroup({
      layout: this.#pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.#projectionBuffer,
          },
        },
      ],
    });

    new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const height = entries[0].contentRect.height;

      if (!width || !height) return;

      this.#canvas.width = entries[0].contentRect.width * window.devicePixelRatio;
      this.#canvas.height = entries[0].contentRect.height * window.devicePixelRatio;
      this.#resize();
    }).observe(this.#canvas);

    this.#resize();

    this.play();
  }

  #resize() {
    this.#msaaTexture?.destroy();

    this.#msaaTexture = this.#device.createTexture({
      size: [this.#canvas.width, this.#canvas.height],
      sampleCount: 4,
      format: this.#gpuPreferredCanvasFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.#msaaView = this.#msaaTexture.createView();

    this.#depthTexture = this.#device.createTexture({
      size: [this.#canvas.width, this.#canvas.height],
      sampleCount: 4,
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.#depthView = this.#depthTexture.createView();

    this.#camera.aspectRatio = this.#canvas.width / this.#canvas.height;

    this.#update();
  }

  #update = () => {
    this.#cameraTransform.update();

    this.#device.queue.writeBuffer(this.#projectionBuffer, 0, this.#camera.projectionView);

    const commandEncoder = this.#device.createCommandEncoder();

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.#msaaView,
          resolveTarget: this.#context.getCurrentTexture().createView(),
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.#depthView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });
    passEncoder.setPipeline(this.#pipeline);
    passEncoder.setBindGroup(0, this.#frameBindGroup);
    passEncoder.setVertexBuffer(0, this.#vertexBuffer);
    passEncoder.setIndexBuffer(this.#indexBuffer, 'uint16');
    passEncoder.drawIndexed(this.#indexBuffer.size / 2);
    passEncoder.end();

    this.#device.queue.submit([commandEncoder.finish()]);
  };
}

window.customElements.define('template-element', TemplateElement);
