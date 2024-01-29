import esbuild from 'rollup-plugin-esbuild';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'src/index.ts',
    output: [{
        file: 'dist/index.js',
        format: 'umd',
        name: 'JModule',
        sourcemap: true,
    }],
    plugins: [
        nodeResolve(),
        commonjs(),
        esbuild({
            include: /\.ts$/,
            exclude: /node_modules/,
            sourceMap: true,
            minify: true,
            target: 'ES2015',
            tsconfig: 'tsconfig.json',
            supported: {
                'import-meta': false,
            },
        }),
    ],
}