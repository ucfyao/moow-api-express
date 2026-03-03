const js = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');
const globals = require('globals');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  js.configs.recommended,
  ...compat.extends('airbnb-base'),
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'no-underscore-dangle': 'off',
      'class-methods-use-this': 'off',
      // Let Prettier handle all formatting (indent, semi, quotes, comma-dangle)
      // — do NOT re-enable them here to avoid circular fix conflicts
      'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
      'no-plusplus': 'off',
      'no-continue': 'off',
      'no-param-reassign': ['error', { props: false }],
      'no-shadow': 'warn',
      'no-await-in-loop': 'off',
      'import/no-unresolved': ['error', { ignore: ['^ccxt$'] }],
    },
  },
  {
    files: ['eslint.config.js', 'jest.config.js'],
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'import/no-unresolved': 'off',
      'import/order': 'off',
      'global-require': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'logs/', '.worktrees/', 'coverage/'],
  },
];
