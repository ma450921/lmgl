import serve from 'rollup-plugin-serve';
import baseConfig, { resolveFile } from './rollup.config.base';

export default {
    input: baseConfig.input,
    output: {
        name: 'lmgl',
        file: resolveFile('examples/lmgl.js'),
        format: 'umd',
        sourcemap: true
    },
    plugin: [].concat(
        baseConfig.plugins,
        serve({
            host: '0.0.0.0',
            prot: 8999,
            contentBase: [resolveFile('examples', resolveFile('dist'))]
        })
    )
}