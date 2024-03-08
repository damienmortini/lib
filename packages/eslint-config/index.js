module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['simple-import-sort', '@typescript-eslint'],
  rules: {
    'n/no-callback-literal': 'off',
    'no-empty': 'warn',
    'prefer-const': ['error', { destructuring: 'all' }],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
  globals: {
    navigation: 'readonly',
    NavigateEvent: 'readonly',
  },
};
