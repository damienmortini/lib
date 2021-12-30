module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    'node': true,
  },
  'extends': [
    'eslint:recommended',
    'google',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'sourceType': 'module',
    'ecmaVersion': 'latest',
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
  },
}