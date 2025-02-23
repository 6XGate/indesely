// @ts-check

import eslint from '@eslint/js';
import importer from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import tsdoc from 'eslint-plugin-tsdoc';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  jsdoc.configs['flat/recommended-typescript-error'],
  importer.flatConfigs.recommended,
  importer.flatConfigs.typescript,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    ignores: [
      'node_modules/**/*',
      'coverage/**/*',
      'dist/**/*',
      'docs/.vitepress/cache',
      'docs/.vitepress/dist',
      '.vscode/**/*',
      '.git/**/*',
    ],
  },
  {
    plugins: { tsdoc },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver-x': { typescript: true },
    },
    // },
    // {
    rules: {
      // JavaScript
      // ==

      // Always require brackets if a statement is multiline.
      'curly': ['error', 'multi-line'],
      // Don't allow variable shadowing.
      'no-shadow': 'error',
      // Prefer string templates over concatenation.
      'prefer-template': 'error',
      // Empty cases with fallthrough are a common, and not misleading pattern.
      'no-fallthrough': [
        'error',
        {
          allowEmptyCase: true,
          reportUnusedFallthroughComment: true,
        },
      ],

      // JSDoc
      // ==

      // Some functions are self explanatory.
      'jsdoc/require-jsdoc': 'off',
      // Some function signature are self explanatory.
      'jsdoc/require-param': ['error', { ignoreWhenAllParamsMissing: true }],
      // Some function signature are self explanatory.
      'jsdoc/require-returns': 'off',
      // Some function signature are self explanatory.
      'jsdoc/require-yields': 'off',
      // The complexity of configuring this is not worth it.
      'jsdoc/tag-lines': 'off',

      // Import
      // ==

      // Go further than TypeScript ESLint, make sure type imports are top-level.
      'import-x/consistent-type-specifier-style': 'error',
      // Certain means of importing is desired.
      'import-x/no-named-as-default-member': 'off',
      // Desired order
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'parent', 'sibling', 'index', 'type'],
          alphabetize: { order: 'asc' },
        },
      ],

      // TSDoc
      'tsdoc/syntax': 'error',

      // TypeScript
      // ==

      // Some situations call for `type` over `interface`.
      '@typescript-eslint/consistent-type-definitions': 'off',
      // Ensure a consistent type import style is adhered to.
      '@typescript-eslint/consistent-type-imports': 'error',
      // Arrow shorthand is rather common, and cleaner.
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      // Some type inferences need `any`.
      '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true }],
      // Ensure any type-only import don't result in side-effects.
      '@typescript-eslint/no-import-type-side-effects': 'error',
      // Still flags necessary type parameters as unnecessary.
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      // To allow full stack traces through asynchronous functions, this is the recommended way.
      '@typescript-eslint/promise-function-async': 'error',
      // Allow some very common template expressions.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // To allow full stack traces through asynchronous functions, this is the recommended way.
      '@typescript-eslint/return-await': ['error', 'always'],
      // Sometimes, better documentation takes priority.
      '@typescript-eslint/unified-signatures': 'off',
    },
  },
);
