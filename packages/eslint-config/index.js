import { includeIgnoreFile } from '@eslint/compat';
import pluginJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import { join } from 'path';
import tseslint from 'typescript-eslint';

const gitignorePath = join(process.cwd(), '.gitignore');

export default [
  {
    ignores: includeIgnoreFile(gitignorePath).ignores, // Has to be done like this while https://github.com/eslint/eslint/issues/18723 is fixed.
  },
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
      'no-empty': 'warn',
      'prefer-const': ['error', { destructuring: 'all' }],
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
];
