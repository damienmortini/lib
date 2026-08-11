import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import pluginJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { includeIgnoreFile } from 'eslint/config';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Collect the `.gitignore` files governing a directory, outermost first, the way git
 * stacks them. ESLint can be invoked from anywhere — a workspace package that was just
 * touched, for instance — so no ignore file can be assumed to sit in the working
 * directory, and a package's own `.gitignore` must not shadow the repository's.
 * @param {string} startDirectory Absolute directory to search upwards from.
 * @returns {string[]} Absolute ignore file paths, empty when the repository has none.
 */
function findIgnoreFiles(startDirectory) {
  const ignoreFiles = [];
  for (let directory = startDirectory; ; directory = dirname(directory)) {
    const ignoreFile = join(directory, '.gitignore');
    if (existsSync(ignoreFile)) ignoreFiles.unshift(ignoreFile);
    // Stop at the repository root: a parent repository's patterns govern its own files,
    // not this one's. A filesystem root ends a checkout that has no repository at all.
    if (existsSync(join(directory, '.git')) || dirname(directory) === directory) return ignoreFiles;
  }
}

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
