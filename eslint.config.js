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
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  {
    ignores: ['node_modules/', 'logs/', '.worktrees/'],
  },
];
