import path from 'path';
import babel from 'rollup-plugin-babel';
import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export const resolveFile = filePath => {
    return path.join(__dirname, '..', filePath);
}
const extensions = ['.json', '.js', '.ts', '.tsx'];
const babelConfig = {
    runtimeHelpers: true,
    exclude: 'node_modules/**',
    extensions
};

const plugins = [
    resolve({extensions}),
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
    input: resolveFile('src/index.ts'),
    plugins
}