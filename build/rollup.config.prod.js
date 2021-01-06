import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import baseConfig, { resolveFile } from './rollup.config.base';

export default [
    {
        input: baseConfig.input,
        output: {
            name: 'lmgl',
            file: resolveFile('dist/lmgl.js'),
            format: 'umd',
            sourcemap: false
        },
        plugins: [].concat(baseConfig.plugins, filesize())
    },
    {
        input: baseConfig.input,
        output: {
            name: 'lmgl',
            file: resolveFile('dist/lmgl.min.js'),
            format: 'umd',
            sourcemap: false
        },
        plugins: [].concat(baseConfig.plugins, terser(), filesize())
    },
    {
        input: baseConfig.input,
        output: {
            name: 'lmgl',
            file: resolveFile('dist/lmgl.esm.js'),
            format: 'es'
        },
        plugins: [].concat(baseConfig.plugins, filesize())
    }
];
