module.exports = {
  'env': {
    browser: true,
    es2021: true,
    node: true,
  },
  'plugins': [
    '@typescript-eslint',
  ],
  'extends': [
    'eslint:recommended',
    'google',
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    sourceType: 'module',
    ecmaVersion: 'latest',
  },
  'globals': {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  'rules': {
    'indent': [
      'error',
      2,
      {
        'SwitchCase': 1,
      },
    ],
    'max-len': 0,
    'linebreak-style': 0,
    'require-jsdoc': 0,
    'object-curly-spacing': [
      2,
      'always',
    ],
    'semi': [
      'error',
      'never',
    ],
    'space-before-function-paren': [
      2,
      {
        'anonymous': 'always',
        'named': 'never',
        'asyncArrow': 'always',
      },
    ],
    'space-infix-ops': ['error', { 'int32Hint': false }],
  },
}
