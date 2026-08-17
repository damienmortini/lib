import config from '@damienmortini/eslint-config';

export default [
  {
    ignores: [
      // Generated declaration emit (`generateTypes` scripts), not hand-written.
      '**/*.d.ts',
      // Vendored third-party code (see packages/three/copyExamples.js and
      // packages/three/loader/meshoptimizerdecoder/ headers).
      'packages/three/examples/**',
      'packages/three/loader/meshoptimizerdecoder/**',
    ],
  },
  ...config,
];
