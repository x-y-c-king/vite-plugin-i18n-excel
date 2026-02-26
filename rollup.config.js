import commonjs from '@rollup/plugin-commonjs'
import babel from "@rollup/plugin-babel";
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import strip from '@rollup/plugin-strip';

const env = process.env.NODE_ENV;
const config = {
	input: 'src/index.ts',
	output: [
		{
			file: 'dist/index.js',
			format: 'esm',
			sourcemap: false,
			name: 'vite-plugin-i18n-excel'
		},
		{
			file: 'dist/index.cjs',
			format: 'cjs',
			sourcemap: false,
			name: 'vite-plugin-i18n-excel'
		}
	],
	external: [
		'vite',
	],
	plugins: [
		commonjs(),
		nodeResolve(),
		typescript({
			tsconfig: './tsconfig.json',
			declaration: true,
			declarationDir: 'dist/types'
		}),
		babel({
			exclude: 'node_modules/**',
			babelHelpers: 'bundled',
			extensions: ['.js', '.jsx', '.ts', '.tsx'],
		}),
		json(),
	],
}

if (env === 'production') {
	config.plugins.push(
		strip({
			debugger: true,
			functions: ['console.log', 'assert.*', 'debug', 'alert'],
			labels: ['unittest'],
			sourceMap: true
		})
	)
} else {
	config.output[0].format = 'umd';
}

export default config;