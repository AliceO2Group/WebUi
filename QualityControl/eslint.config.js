import globals from 'globals';
import pluginJs from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import stylisticJs from '@stylistic/eslint-plugin-js';

export default [
  jsdoc.configs['flat/recommended'],
  pluginJs.configs.recommended,
  {
    ignores: ['config-default.js', 'public/config.js', 'config.js', 'jsconfig.json'],
    plugins: {
      jsdoc,
      '@stylistic/js': stylisticJs,
    },
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        process: 'readonly',
        Model: 'readonly',
        vnode: 'readonly',
        Express: 'readonly',
        setImmediate: 'readonly',
      },
    },
    rules: {
      'arrow-body-style': ['error', 'as-needed'],
      curly: 'error',
      indent: [
        'error',
        2,
        {
          SwitchCase: 1,
        },
      ],
      'init-declarations': ['error', 'always'],
      'no-console': 'error',
      'no-implicit-coercion': 'error',
      'no-return-assign': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^(_|((request|response|next)$))',
        },
      ],
      'no-var': 'error',
      'one-var': [
        'error',
        'never',
      ],
      'prefer-arrow-callback': [
        'error',
        {
          allowUnboundThis: true,
        },
      ],
      'prefer-const': 'error',
      'prefer-destructuring': 'error',
      'prefer-object-spread': 'error',
      'prefer-template': 'error',
      radix: 'error',
      'jsdoc/require-description': ['error'],
      'jsdoc/check-values': ['off'],
      'jsdoc/no-multi-asterisks': ['off'],
      'jsdoc/no-undefined-types': ['off'],
      'jsdoc/check-tag-names': ['warn', { definedTags: ['rejects'] }],
      'jsdoc/no-defaults': ['off'],
      '@stylistic/js/array-bracket-newline': [
        'error',
        {
          multiline: true,
        },
      ],
      '@stylistic/js/array-bracket-spacing': [
        'error',
        'never',
        {
          singleValue: false,
        },
      ],
      '@stylistic/js/array-element-newline': [
        'error',
        'consistent',
      ],
      '@stylistic/js/arrow-parens': [
        'error',
        'always',
      ],
      '@stylistic/js/brace-style': [
        'error',
        '1tbs',
        {
          allowSingleLine: false,
        },
      ],
      '@stylistic/js/comma-dangle': [
        'error',
        'always-multiline',
      ],
      '@stylistic/js/comma-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],
      '@stylistic/js/comma-style': [
        'error',
        'last',
      ],
      '@stylistic/js/computed-property-spacing': 'error',
      '@stylistic/js/dot-location': [
        'error',
        'property',
      ],
      '@stylistic/js/eol-last': [
        'error',
        'always',
      ],
      '@stylistic/js/function-call-argument-newline': [
        'error',
        'consistent',
      ],
      '@stylistic/js/function-paren-newline': [
        'error',
        'multiline',
      ],
      '@stylistic/js/indent': [
        'error',
        2,
        {
          SwitchCase: 1,
        },
      ],
      '@stylistic/js/key-spacing': 'error',
      '@stylistic/js/keyword-spacing': 'error',
      '@stylistic/js/linebreak-style': 'off',
      '@stylistic/js/lines-around-comment': [
        'error',
        {
          allowBlockStart: true,
          allowClassStart: true,
          beforeBlockComment: true,
        },
      ],
      '@stylistic/js/lines-between-class-members': [
        'error',
        'always',
      ],
      '@stylistic/js/max-len': [
        'error',
        {
          code: 120,
        },
      ],
      '@stylistic/js/no-extra-parens': 'error',
      '@stylistic/js/no-multi-spaces': 'error',
      '@stylistic/js/no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxBOF: 0,
          maxEOF: 0,
        },
      ],
      '@stylistic/js/no-trailing-spaces': 'error',
      '@stylistic/js/object-curly-spacing': [
        'error',
        'always',
      ],
      '@stylistic/js/object-property-newline': [
        'error',
        {
          allowAllPropertiesOnSameLine: true,
        },
      ],
      '@stylistic/js/padded-blocks': [
        'error',
        'never',
      ],
      '@stylistic/js/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: 'cjs-import',
          next: '*',
        },
        {
          blankLine: 'any',
          prev: 'cjs-import',
          next: 'cjs-import',
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'cjs-export',
        },
      ],
      '@stylistic/js/quote-props': [
        'error',
        'as-needed',
      ],
      '@stylistic/js/quotes': [
        'error',
        'single',
        {
          avoidEscape: true,
        },
      ],
      '@stylistic/js/semi': 'error',
      '@stylistic/js/semi-style': [
        'error',
        'last',
      ],
      '@stylistic/js/space-before-blocks': [
        'error',
        {
          functions: 'always',
          keywords: 'always',
          classes: 'always',
        },
      ],
      '@stylistic/js/space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      '@stylistic/js/space-infix-ops': 'error',
      '@stylistic/js/space-in-parens': [
        'error',
        'never',
      ],
      '@stylistic/js/template-curly-spacing': [
        'error',
        'never',
      ],
      'no-magic-numbers': 'off', // TODO: enable
    },
  },
];
