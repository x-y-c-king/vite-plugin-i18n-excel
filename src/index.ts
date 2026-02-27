import type { Plugin } from "vite"

import * as fs from "fs"
import * as path from "path"
import * as XLSX from "xlsx"

import { jsonToExcel, type JsonToExcelOptions } from './JsonToExcel'
import { deepMerge } from './deepMerge'

export interface I18nExcelOptions {
	/**
	 * Excel 文件路径（相对于项目根目录）
	 * @default 'src/locales/translations.xlsx'
	 */
	excelPath?: string

	/**
	 * 生成的语言 JSON 文件输出目录
	 * @default 'src/locales'
	 */
	outputDir?: string

	/**
	 * Excel 中哪一个 Sheet（工作表名或索引）
	 * @default 0（第一个 Sheet）
	 */
	sheetName?: string | number

	/**
	 * key 所在列的列名（Excel 列标题）
	 * @default 'key'
	 */
	keyColumn?: string

	/**
	 * 是否将 key 中的 "." 解析为嵌套对象
	 * 例如 "common.confirm" → { common: { confirm: '...' } }
	 * @default true
	 */
	nestedKeys?: boolean

	/**
	 * 忽略多少行（通常是标题行） 默认值 1 忽略第一行标题行，如果有其他标题行，请自行调整
	 */
	ignoreRow?: number

	/**
	 * 重写语言映射的key
	 * 例如 { en_old: 'en }
	 * 当 (key | zh | en_old | en) 为这样的时候en列没有值的时候，会使用 en_old列的值，同时不会生成en_old.json文件
	 */
	localeMap?: Record<string, string>

	/**
	 * 生成文件后的回调
	 */
	onGenerated?: (files: GeneratedFile[]) => void
}

export interface GeneratedFile {
	locale: string
	filePath: string
	data: Record<string, unknown>
}

/**
 * 将 "a.b.c" 格式的 key 设置到嵌套对象中
 */
// 改动后（新增 isArrayIndex 辅助函数 + 改写 setNestedKey）
function isArrayIndex(k: string): boolean {
  return /^\d+$/.test(k)
}

function setNestedKey(obj: Record<string, unknown>, keyPath: string, value: string) {
  const keys = keyPath.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    const nextKey = keys[i + 1]
    const nextIsIndex = isArrayIndex(nextKey)

    if (current[k] === undefined || current[k] === null || typeof current[k] !== 'object') {
      current[k] = nextIsIndex ? [] : {}
    } else if (nextIsIndex && !Array.isArray(current[k])) {
      current[k] = []
    } else if (!nextIsIndex && Array.isArray(current[k])) {
      current[k] = {}
    }

    current = current[k] as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
}

/**
 * 解析 Excel 文件，返回各语言的翻译对象
 */
export function parseExcel(
	excelPath: string,
	options: Pick<
		I18nExcelOptions,
		"sheetName" | "keyColumn" | "nestedKeys" | "ignoreRow" | "localeMap"
	>
): Map<string, Record<string, unknown>> {
	const {
		sheetName = 0,
		keyColumn = "key",
		nestedKeys = true,
		ignoreRow = 1,
		localeMap = {}
	} = options

	if (!fs.existsSync(excelPath)) {
		throw new Error(`[vite-plugin-i18n-excel] Excel 文件不存在: ${excelPath}`)
	}

	const localeMapCopy = Object.entries(localeMap).reduce((acc, curr) => {
		const [key, value] = curr
		acc[value] = key
		return acc
	}, {} as Record<string, string>)

	const fileBuffer = fs.readFileSync(excelPath)
	const workbook = XLSX.read(fileBuffer, { type: "buffer", raw: false })
	let worksheet: XLSX.WorkSheet
	if (typeof sheetName === "number") {
		const name = workbook.SheetNames[sheetName]
		if (!name) throw new Error(`[vite-plugin-i18n-excel] Sheet 索引 ${sheetName} 不存在`)
		worksheet = workbook.Sheets[name]
	} else {
		if (!workbook.Sheets[sheetName]) {
			throw new Error(`[vite-plugin-i18n-excel] Sheet "${sheetName}" 不存在`)
		}
		worksheet = workbook.Sheets[sheetName]
	}

	// 转为 JSON（第一行作为 header）
	const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
		defval: "",
		raw: false
	})

	if (rows.length === 0) {
		console.warn("[vite-plugin-i18n-excel] Excel 文件为空，没有生成任何翻译文件")
		return new Map()
	}

	// 获取所有语言列（排除 key 列）
	const headers = Object.keys(rows[0])
	const locales = headers.filter((h) => h !== keyColumn && !localeMap[h])

	if (locales.length === 0) {
		throw new Error(
			`[vite-plugin-i18n-excel] 没有找到语言列，请确认第一行包含语言标识（除 "${keyColumn}" 列外）`
		)
	}

	// 构建每个语言的翻译对象
	const result = new Map<string, Record<string, unknown>>()
	for (const locale of locales) {
		result.set(locale, {})
	}

	const list = ignoreRow === 1 ? rows : rows.slice(ignoreRow - 1)
	for (const row of list) {
		const key = row[keyColumn]?.trim()
		if (!key) continue // 跳过空 key

		for (const locale of locales) {
			let value = row[locale] ?? ""

			// 重写语言映射的key
			if (Reflect.has(localeMapCopy, locale)) {
				value = (value || row[localeMapCopy[locale]]) ?? ""
			}

			const localeObj = result.get(locale)!
			if (nestedKeys && key.includes(".")) {
				setNestedKey(localeObj, key, value)
			} else {
				localeObj[key] = value
			}
		}
	}

	return result
}

/**
 * 将翻译对象写入 JSON 文件
 */
function writeLocaleFiles(
	translations: Map<string, Record<string, unknown>>,
	outputDir: string
): GeneratedFile[] {
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true })
	}

	const generated: GeneratedFile[] = []

	for (const [locale, data] of translations) {
		const filePath = path.join(outputDir, `${locale}.json`)
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
		generated.push({ locale, filePath, data })
		console.log(`[vite-plugin-i18n-excel] ✅ 已生成: ${filePath}`)
	}

	return generated
}

/**
 * Vite 插件主体
 */
export function i18nExcelPlugin(options: I18nExcelOptions = {}): Plugin {
	const {
		excelPath = "src/locales/translations.xlsx",
		outputDir = "src/locales",
		sheetName = 0,
		keyColumn = "key",
		nestedKeys = true,
		ignoreRow = 1,
		localeMap = {},
		onGenerated
	} = options

	let root = process.cwd()
	let isBuild = false
	let generated = false

	const generate = (rootDir: string) => {
		const absExcelPath = path.resolve(rootDir, excelPath)
		const absOutputDir = path.resolve(rootDir, outputDir)

		try {
			console.log(`[vite-plugin-i18n-excel] 📖 读取 Excel: ${absExcelPath}`)
			const translations = parseExcel(absExcelPath, {
				sheetName,
				keyColumn,
				nestedKeys,
				ignoreRow,
				localeMap
			})
			const files = writeLocaleFiles(translations, absOutputDir)
			onGenerated?.(files)
		} catch (err) {
			console.error(`[vite-plugin-i18n-excel] ❌ 错误:`, err)
		}
	}

	return {
		name: "vite-plugin-i18n-excel",

		configResolved(config) {
			root = config.root
			isBuild = config.command === "build"
			// 启动时自动生成
			if (!isBuild) {
				generate(root)
				generated = true
			}
		},

		configureServer(server) {
			// watch 模式：监听 Excel 文件变动
			const absExcelPath = path.resolve(root, excelPath)
			server.watcher.add(absExcelPath)

			server.watcher.on("change", (changedPath) => {
				if (path.resolve(changedPath) === absExcelPath) {
					console.log(`[vite-plugin-i18n-excel] 🔄 检测到 Excel 变动，重新生成...`)
					generate(root)
					// 触发 HMR 热更新
					server.ws.send({ type: "full-reload" })
				}
			})
		},

		// build 时也执行一次生成
		buildStart() {
			// build 模式在此处生成，且只生成一次（防止 watch build 重复触发）
			if (isBuild && !generated) {
				generate(root)
				generated = true
			}
		}
	}
}

export { jsonToExcel, type JsonToExcelOptions, deepMerge }
export default i18nExcelPlugin
