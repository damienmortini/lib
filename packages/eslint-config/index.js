module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'n/no-callback-literal': 'off',
    'prettier/prettier': ['error'],
    'no-empty': 'warn',
  },
  globals: {
    navigation: 'readonly',
    NavigateEvent: 'readonly',
  },
}
