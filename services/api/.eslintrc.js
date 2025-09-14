module.exports = {
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'error',
    'no-extra-semi': 'error',
    'no-func-assign': 'error',
    'no-irregular-whitespace': 'error',
    'no-unexpected-multiline': 'error',
    'valid-typeof': 'error'
  },
  env: {
    node: true,
    jest: true,
    es2022: true
  },
  ignorePatterns: ['node_modules/', 'coverage/']
};
