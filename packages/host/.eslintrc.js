// http://eslint.org/docs/user-guide/configuring
module.exports = {
  root: true,
  // parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  env: {
    browser: true,
  },
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  // extends: 'airbnb-base',
  // add your custom rules here
  'rules': {
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'indent': ['error', 2],
    "no-undef": "off",
    'no-nested-ternary': [1],
    'linebreak-style': 0,
  }
}