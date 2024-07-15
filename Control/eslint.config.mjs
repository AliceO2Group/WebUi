import pluginJs from "@eslint/js";
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
      },
      globals: {
        process: "readonly",
      },
      sourceType: "commonjs",
    },
    plugins: {
      jsdoc,
    },
    rules: {
      // "no-unused-vars": "warn",
      "no-undef": "warn",
      "max-len": ['error', {"code": 120, "ignoreComments": true}], // default 80
      "indent": ['error', 2, {"SwitchCase": 1}], // not set by default
      "quote-props": ["error", "as-needed"],
      "comma-dangle": ["error", "only-multiline"], // allow trailing comma on multiline https://github.com/airbnb/javascript#commas--dangling
      "curly": [2, "all"], // enfornce curly braces even in single line if-else
      "no-unused-vars": ["error", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false, "argsIgnorePattern": "(next|model|^_)"}],
      "jsdoc/require-description": ["error", {
          "require": {
              "FunctionDeclaration": true,
              "MethodDefinition": true,
              "ClassDeclaration": true,
              "ArrowFunctionExpression": true,
              "FunctionExpression": true
          }
      }],
      "no-cond-assign": "off",
      "linebreak-style": "warn"
    }
  },
  pluginJs.configs.recommended,
  jsdoc.configs['flat/recommended'],
];