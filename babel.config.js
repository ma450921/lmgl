module.exports = {
    "presets": [
        ['@babel/preset-env'],
        '@babel/preset-typescript'
    ],
    "plugins": [
        ["@babel/plugin-transform-runtime", {
            "corejs": false,
            "helpers": true,
            "regenerator": true,
            "useESModules": false
        }]
    ]
};