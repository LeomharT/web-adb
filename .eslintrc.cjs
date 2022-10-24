module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es6: true
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        "sourceType": "module"
    },
    extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        'plugin:react-hooks/recommended',
    ],
    rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "warn"
    },
    plugins: [
        '@typescript-eslint'
    ]
};
