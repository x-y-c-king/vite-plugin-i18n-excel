import vue from "@vitejs/plugin-vue"
import { defineConfig, loadEnv } from "vite"
import legacy from "@vitejs/plugin-legacy"
import { i18nExcelPlugin } from "vite-plugin-i18n-excel"

import path, { join } from "path"

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, "./")
	const openUpload = env.VITE_NODE_ENV == "production"

	return {
		base: `./`,
		optimizeDeps: {
			include: ["vue", "vue-router"]
		},
		define: {
			"process.env": JSON.stringify({ ...env, NODE_ENV: mode })
		},
		plugins: [
			vue(),

			legacy({
				targets: [
					"defaults",
					"iOS >= 9",
					"Android >= 4.4",
					"last 2 versions",
					"> 0.2%",
					"not ie < 9",
					"not dead"
				]
			}),
			i18nExcelPlugin({
				// Excel 文件路径（相对于项目根目录）
				excelPath: "src/locales/translations.xlsx",

				// 生成的 JSON 文件输出目录
				outputDir: "src/locales/json",

				// key 所在列的标题（Excel 第一行中的列名）
				keyColumn: "key",

				// 是否将 "a.b.c" 解析为嵌套对象，默认 true
				nestedKeys: true,

				// 读取第几个 Sheet（0 = 第一个，也可传 Sheet 名称字符串）
				sheetName: 0,

				// 忽略前两行
				ignoreRow: 2,

				// 语言映射，可选
				localeMap: {
					"en_old": 'en'
				},


				// 生成完成后的回调（可选）
				onGenerated(files: any[]) {
					console.log(
						"生成的语言文件:",
						files.map((f) => f.locale)
					)
				}
			})
		],
		resolve: {
			alias: [{ find: "@", replacement: join(__dirname, "src") }]
		},
		build: {
			assetsInlineLimit: 4096, // 小于4kb 转base64
			minify: "esbuild",
			terserOptions: {
				compress: {
					drop_console: openUpload,
					drop_debugger: openUpload
				}
			},
			sourcemap: false,
			rollupOptions: {
				output: {
					manualChunks: {
						// 将 vue 相关的库打包到一个单独的 chunk 中
						// vue: ["vue", "vue-router", "pinia"],
						// 将 lodash 打包到一个单独的 chunk 中
						// lodash: ["lodash"]
					},
					entryFileNames: "js/[name]-[hash].js",
					chunkFileNames: "js/chunks/[name]-[hash].js",

					assetFileNames: (assetInfo) => {
						const fileName = assetInfo.names?.[0] || ""
						const extname = path.extname(fileName).toLowerCase()

						if (extname === ".css") {
							return "css/[name]-[hash].[ext]"
						}

						if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"].includes(extname)) {
							return "images/[name]-[hash].[ext]"
						}
						// 字体类型
						if ([".woff", ".woff2", ".eot", ".ttf", ".otf"].includes(extname)) {
							return "fonts/[name]-[hash].[ext]"
						}
						// 其他资源（如视频、音频等）
						return "assets/[name]-[hash].[ext]"
					}
				}
			}
		},
		server: {
			open: false, // 自动在浏览器打开
			// port: 8081,
			host: "0.0.0.0",
			proxy: {
				"/api": {
					target: "http://xxxx",
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api/, ""),
					secure: false
				}
			}
		}
	}
})
