module.exports = {
  "root": true,
  "extends": ["eslint:recommended", "google"],
  "env": {
    "es6": true,
    "node": true,
    "jquery" : true,
    "browser": true,
    "mocha": true
  },
  "globals": {
    "Promise": true
  },
  "parserOptions": {
    "ecmaVersion": 8,
    "sourceType": "module"
  },
  "rules": {
    "max-len": ['error', {code: 100}], // default 80
    "indent": ['error', 2, {"SwitchCase": 1}], // not set by default
    "comma-dangle": ["error", "only-multiline"], // allow trailing comma on multiline https://github.com/airbnb/javascript#commas--dangling
    "curly": [2, "all"], // enfornce curly braces even in single line if-else
    "no-unused-vars": ["error", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false, "argsIgnorePattern": "next" }]
  }
}
