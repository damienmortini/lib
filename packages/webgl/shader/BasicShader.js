import { addChunks, FRAGMENT, VERTEX } from '../GLSLShader.js'
import Matrix4 from '@damienmortini/math/Matrix4.js'

export class BasicShader {
  constructor({ positions = true, normals = false, uvs = false, uniforms = {}, vertexChunks = [], fragmentChunks = [] } = {}) {
    this.uniforms = {
      projectionView: new Matrix4(),
      transform: new Matrix4(),
      ...uniforms,
    }

    this.vertex = addChunks(VERTEX, [
      [
        'start',
        `
        uniform mat4 projectionView;
        uniform mat4 transform;

        ${positions ? 'in vec3 position;' : ''}
        ${normals ? 'in vec3 normal;' : ''}
        ${uvs ? 'in vec2 uv;' : ''}

        ${positions ? 'out vec3 vPosition;' : ''}
        ${normals ? 'out vec3 vNormal;' : ''}
        ${uvs ? 'out vec2 vUV;' : ''}
      `,
      ],
      [
        'main',
        `
        ${positions ? 'vPosition = position;' : ''}
        ${normals ? 'vNormal = normal;' : ''}
        ${uvs ? 'vUV = uv;' : ''}
      `,
      ],
      [
        'end',
        `
        gl_Position = projectionView * transform * vec4(position, 1.);
      `,
      ],
      ...vertexChunks,
    ])

    this.fragment = addChunks(FRAGMENT, [
      [
        'start',
        `
        ${positions ? 'in vec3 vPosition;' : ''}
        ${normals ? 'in vec3 vNormal;' : ''}
        ${uvs ? 'in vec2 vUV;' : ''}
      `,
      ],
      ...fragmentChunks,
    ])
  }
}
