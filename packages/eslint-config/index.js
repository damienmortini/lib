import pluginJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { includeIgnoreFile } from 'eslint/config';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { findIgnoreFiles } from './find-ignore-files.js';

export default [
  // `gitignoreResolution` anchors each file's patterns to its own directory, so they keep
  // meaning what git means by them however deep ESLint was invoked.
  ...includeIgnoreFile(findIgnoreFiles(process.cwd()), { gitignoreResolution: true }),
  stylistic.configs.customize({
    semi: true,
  }),
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      ecmaVersion: 'latest',
      sourceType: 'module',
      // globals: {
      //   navigation: "readonly",
      //   NavigateEvent: "readonly",
      // },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      '@stylistic': stylistic,
    },
    rules: {
      'n/no-callback-literal': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'prefer-const': ['error', { destructuring: 'all' }],
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
];
