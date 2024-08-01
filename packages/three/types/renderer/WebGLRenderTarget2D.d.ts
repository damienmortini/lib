export class WebGLRenderTarget2D {
  constructor({
    renderer,
    material,
    width,
    height,
    wrapS,
    wrapT,
    magFilter,
    minFilter,
    format,
    type,
    anisotropy,
    encoding,
    generateMipmaps,
    depthBuffer,
    stencilBuffer,
    depthTexture,
  }: {
    renderer: any;
    material?: any;
    width?: number;
    height?: number;
    wrapS?: any;
    wrapT?: any;
    magFilter?: any;
    minFilter?: any;
    format?: any;
    type?: any;
    anisotropy?: any;
    encoding?: any;
    generateMipmaps?: any;
    depthBuffer?: any;
    stencilBuffer?: any;
    depthTexture?: any;
  });
  renderer: any;
  set material(arg: any);
  get material(): any;
  render({ debug }?: { debug?: boolean }): void;
  #private;
}
