export const VERTEX: '#version 300 es\nvoid main() {\n  gl_Position = vec4(0., 0., 0., 1.);\n}';
export const FRAGMENT: '#version 300 es\nprecision highp float;\n\nout vec4 fragColor;\n\nvoid main() {\n  fragColor = vec4(1.);\n}';
export function addChunks(shader: any, chunks: any): any;
export function getUniformData(shader: any): Map<any, any>;
