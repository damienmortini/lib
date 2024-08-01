export class BasicShader {
  constructor({ positions, normals, uvs, uniforms, vertexChunks, fragmentChunks }?: {
    positions?: boolean;
    normals?: boolean;
    uvs?: boolean;
    uniforms?: {};
    vertexChunks?: any[];
    fragmentChunks?: any[];
  });
  uniforms: {
    projectionView: any;
    transform: any;
  };

  vertex: any;
  fragment: any;
}
