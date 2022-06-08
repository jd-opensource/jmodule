module.exports = {
    root: true,
    parserOptions: {
        sourceType: 'module'
    },
    "parser": "@typescript-eslint/parser",
    "plugins": ["@typescript-eslint"],
    env: {
        browser: true,
    },
    "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    'rules': {
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
        'indent': ['error', 4],
        "no-undef": "off",
        'no-nested-ternary': [1],
        'linebreak-style': 0,
        '@typescript-eslint/no-explicit-any': 0,
    }
}