/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

const globals = require('globals');
const pluginJs = require('@eslint/js');
const tseslint = require('typescript-eslint');
const jsdoc = require('eslint-plugin-jsdoc');
const stylisticTs = require('@stylistic/eslint-plugin-ts');
const stylisticJs = require('@stylistic/eslint-plugin-js');

const licenseHeader = `/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */`;

const licenseHeaderRule = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Require license header at the top of files',
      category: 'Stylistic Issues',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText();
        
        if (text.includes('@license')) {
          return;
        }
        
        context.report({
          node,
          message: 'Missing license header',
          fix(fixer) {
            return fixer.insertTextBefore(node, licenseHeader + '\n\n');
          },
        });
      },
    };
  },
};

module.exports = [
  {
    ignores: [
      '**/test/',
      '**/tests/',
      '**/node_modules/',
      '**/build/',
      '**/dist/',
      '**/database/data/',
      '**/lib/public/assets/',
      '**/cpp-api-client/',
      '**/tmp/',
      '**/.nyc_output/',
    ],
  },
  
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

 
  {
    files: ['**/*.{js,ts}'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'jsdoc': jsdoc,
      '@stylistic/ts': stylisticTs,
      '@stylistic/js': stylisticJs,
      'custom': { 
        rules: {
          'license-header': licenseHeaderRule,
        },
      },
    },
    
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'commonjs',
        project: ['./tsconfig.json'], 
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.commonjs,
      },
    },
    
    settings: {
      jsdoc: {
        mode: 'typescript',
        tagNamePreference: {
          returns: 'return',
        },
      },
    },
    
    rules: {
      // === CUSTOM RULES ===
      'custom/license-header': 'error',
      
      // === TYPESCRIPT SPECIFIC RULES ===
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      
      // === GENERAL CODE QUALITY ===
      'arrow-body-style': ['error', 'as-needed'],
      'curly': 'error',
      'no-console': 'error',
      'no-implicit-coercion': 'error',
      'no-return-assign': 'error',
      'no-var': 'error',
      'one-var': ['error', 'never'],
      'prefer-const': 'error',
      'prefer-destructuring': 'warn',
      'prefer-template': 'error',
      'radix': 'error',
      
      // === COMMENTS AND DOCUMENTATION ===
      'capitalized-comments': ['error', 'always'],
      'jsdoc/require-description': 'error',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: true,
          },
        },
      ],
      
      // === TYPESCRIPT STYLISTIC RULES ===
      '@stylistic/ts/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/ts/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/ts/indent': ['error', 2],
      '@stylistic/ts/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/ts/semi': 'error',
      '@stylistic/ts/space-before-blocks': 'error',
      '@stylistic/ts/space-infix-ops': 'error',
      '@stylistic/ts/object-curly-spacing': ['error', 'always'],
      '@stylistic/ts/keyword-spacing': 'error',
      '@stylistic/ts/type-annotation-spacing': 'error',
      '@stylistic/ts/member-delimiter-style': 'error',
      
      // === JAVASCRIPT STYLISTIC RULES ===
      '@stylistic/js/array-bracket-spacing': ['error', 'never'],
      '@stylistic/js/brace-style': ['error', '1tbs'],
      '@stylistic/js/no-trailing-spaces': 'error',
      '@stylistic/js/eol-last': ['error', 'always'],
      '@stylistic/js/max-len': ['error', { code: 145 }],
      '@stylistic/js/no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],
      
      // === DISABLED RULES ===
      'no-magic-numbers': 'off',
      'sort-keys': 'off',
      'sort-imports': 'off',
      'sort-vars': 'off',
    },
  },
  {
    files: ['**/*.test.{js,ts}', '**/test/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.jest,
       
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },

    rules: {
      'no-console': 'off', 
      'jsdoc/require-jsdoc': 'off',
    },
  },
];