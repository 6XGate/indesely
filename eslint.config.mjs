// @ts-check

import eslint from '@eslint/js';
import importer from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import tsdoc from 'eslint-plugin-tsdoc';
import tseslint, { configs as tsconfigs } from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  importer.flatConfigs.recommended,
  importer.flatConfigs.typescript,
  tsconfigs.strictTypeChecked,
  tsconfigs.stylisticTypeChecked,
  jsdoc.configs['flat/recommended-typescript-error'],
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
      // # JavaScript
      //
      // Powered by core ESLint rules, inspired by Standard.
      //
      // Some deviation due to Prettier conflicts or overly strict or lax rules
      // from standard. Overtime, rules added to the recommended configuration
      // should be removed from here, except in the rare case where they
      // will differ from the default.

      // ## Possible Problems

      'array-callback-return': 'error',
      'no-await-in-loop': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-constructor-return': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-promise-executor-return': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-private-class-members': 'error',
      'no-fallthrough': [
        'error',
        {
          allowEmptyCase: true,
          reportUnusedFallthroughComment: true,
        },
      ],

      // ## Suggestions

      'accessor-pairs': 'error',
      'curly': ['error', 'multi-line'],
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'grouped-accessor-pairs': 'error',
      'guard-for-in': 'error',
      'no-alert': 'error',
      'no-caller': 'error',
      'no-div-regex': 'error',
      'no-else-return': 'warn',
      'no-empty-static-block': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-floating-decimal': 'error',
      'no-implicit-coercion': 'error',
      'no-implicit-globals': 'error',
      'no-iterator': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-lonely-if': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-nested-ternary': 'warn',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-nonoctal-decimal-escape': 'error',
      'no-octal-escape': 'error',
      'no-param-reassign': ['error', { props: false }],
      'no-return-assign': 'error',
      'no-sequences': 'error',
      'no-shadow-restricted-names': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'no-useless-call': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',
      'no-var': 'error',
      'no-void': 'error',
      'object-shorthand': 'error',
      'one-var': ['error', { initialized: 'never' }],
      'prefer-const': 'error',
      'prefer-exponentiation-operator': 'error',
      'prefer-numeric-literals': 'warn',
      'prefer-object-spread': 'error',
      'prefer-promise-reject-errors': 'error',
      'prefer-regex-literals': 'warn',
      'prefer-rest-params': 'error',
      'prefer-spread': 'warn',
      'prefer-template': 'warn',
      'radix': 'error',
      'require-unicode-regexp': 'error',
      'require-yield': 'error',
      'yoda': 'error',

      // # Import
      //
      // Powered by Import-X, inspired by Standard.
      //
      // These will go beyond the recommended import plug-in configuration.
      // Overtime, rules added to the recommended configuration should
      // be removed from here, except in the rare case where they
      // will differ from the default.

      // ## Helpful warnings

      'import-x/no-empty-named-blocks': 'error',
      'import-x/no-mutable-exports': 'error',
      'import-x/no-unused-modules': 'error',
      'import-x/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['tests/**/*', 'docs/**/*', 'docs/.vitepress/*', '*.config.mjs', '*.config.ts'] },
      ],

      // ## Module systems

      'import-x/no-amd': 'error',

      // ## Static analysis

      'import-x/no-absolute-path': 'error',
      'import-x/no-cycle': 'warn',
      'import-x/no-dynamic-require': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',

      // ## Style guide

      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-anonymous-default-export': 'warn',
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'parent', 'sibling', 'index', 'type'],
          alphabetize: { order: 'asc' },
        },
      ],

      // ## Recommended overrides

      'import-x/default': 'off', // Handled by TypeScript.
      'import-x/named': 'off', // Handled by TypeScript.
      'import-x/namespace': 'off', // Handled by TypeScript.
      'import-x/no-unresolved': 'off', // Handled by TypeScript.

      // # TypeScript
      //
      // Inspired by Standard with TypeScript.
      //
      // TypeScript rules. These will go beyond the TypeScript strict and stylistic configuration.
      // Overtime, rules added to those TypeScript configuration should be removed from
      // here, except in the rare case where we will differ from the default.

      // ## General

      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // ## Type checked

      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          // Disallow some common uses that can cause bugs.
          allowNumber: false,
          // Common uses that make for cleaner code.
          allowNullableBoolean: true,
          allowNullableString: true,
        },
      ],

      // ## Extension

      '@typescript-eslint/consistent-return': 'error',
      '@typescript-eslint/default-param-last': 'error',
      '@typescript-eslint/no-loop-func': 'error',
      '@typescript-eslint/no-shadow': 'error',

      // ## Recommended overrides

      '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowNever: true }],
      '@typescript-eslint/return-await': ['error', 'always'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],

      // ## Strict overrides

      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-unnecessary-type-parameters': 'off', // Too strict for its own good.
      '@typescript-eslint/unified-signatures': 'off', // Too strict or buggy.

      // ## Stylistic overrides

      '@typescript-eslint/consistent-type-definitions': 'off', // Some cases may be incompatible with `interface`.

      // # TSDoc
      //
      // General TSDoc syntax enforcement, additional support from JSDoc for
      // meeting guideline requirements.

      'tsdoc/syntax': 'error',

      // # JSDoc
      //
      // General TSDoc guideline enforcement using JSDoc. Don't want to require
      // function element documentation, but do want to enforce some rules.
      // Some options adjusted if they don't mix well with TSDoc.

      'jsdoc/check-param-names': ['error', { checkDestructured: false }],
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': ['error', { ignoreWhenAllParamsMissing: true, checkDestructuredRoots: false }],
      'jsdoc/require-returns': 'off',
      'jsdoc/require-yields': 'off',
      'jsdoc/tag-lines': 'off', // More work than it's worth.
    },
  },
  {
    files: ['tests/**/*'],
    rules: {
      // Kinda needed heavily in tests.
      'no-await-in-loop': 'off',
    },
  },
);
