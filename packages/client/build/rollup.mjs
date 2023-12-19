import esbuild from 'rollup-plugin-esbuild';

export default {
    input: 'src/index.ts',
    output: [{
        file: 'dist/index.esm.js',
        format: 'es',
        sourcemap: true,
    }, {
        file: 'dist/index.js',
        format: 'umd',
        name: 'JModule',
        sourcemap: true,
    }],
    plugins: [
        esbuild({
            include: /\.ts$/,
            exclude: /node_modules/,
            sourceMap: true,
            minify: true,
            target: 'ES2020',
            tsconfig: 'tsconfig.json',
        }),
    ],
}