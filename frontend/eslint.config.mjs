import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import importX from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const typescriptFiles = ['**/*.{ts,tsx}'];

const importOrder = {
  groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
  pathGroups: [
    {
      pattern: 'react{,-dom}{,/**}',
      group: 'external',
      position: 'before',
    },
    {
      pattern: '@/**',
      group: 'internal',
      position: 'before',
    },
  ],
  pathGroupsExcludedImportTypes: ['builtin'],
  distinctGroup: false,
  'newlines-between': 'always',
  alphabetize: {
    order: 'asc',
    caseInsensitive: true,
  },
};

export default tseslint.config(
  {
    ignores: [
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'public/mockServiceWorker.js',
      'storybook-static/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: typescriptFiles,
  })),
  {
    files: ['**/*.{js,ts,tsx}'],
    plugins: {
      'import-x': importX,
    },
    rules: {
      'import-x/order': ['error', importOrder],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: ['.storybook/preview.ts'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['webpack.config.cjs', '.storybook/main.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
);
