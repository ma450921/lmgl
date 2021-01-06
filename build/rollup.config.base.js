import path from 'path';
import babel from 'rollup-plugin-babel';
import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export const resolveFile = filePath => {
    return path.join(__dirname, '..', filePath);
}

const babelConfig = {
    runtimeHelpers: true,
    exclude: 'node_modules/**'
};

const plugins = [
    resolve(),
    commonjs({
        exclude: 'src/**'
    }),
    babel(babelConfig),
    alias({
        resolve: ['.js'],
        entries: {
            '@': resolveFile('src')
        }
    })
];

export default {
    input: resolveFile('src/index.mjs'),
    plugins
}