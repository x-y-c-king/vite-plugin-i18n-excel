import * as fs from "fs"
import * as path from "path"
import * as XLSX from "xlsx"

const HEADER_LABEL = "语言"

export interface JsonToExcelOptions {
	/**
	 * 语言 JSON 文件所在目录
	 * @default 'src/locales'
	 */
	localesDir?: string

	/**
	 * 输出的 Excel 文件路径
	 * @default 'src/locales/translations.xlsx'
	 */
	excelPath?: string

	/**
	 * key 列的列名
	 * @default 'key'
	 */
	keyColumn?: string

	/**
	 * 指定要扫描的语言列表，不填则自动扫描目录下所有 .json 文件
	 * 例如: ['zh-CN', 'en-US']
	 */
	locales?: string[]

	/**
	 * 合并模式：
	 * - 'overwrite': 完全覆盖重新生成
	 * - 'merge': 增量合并（已有翻译保留，新 key 追加到末尾）
	 * @default 'merge'
	 */
	mergeMode?: "overwrite" | "merge"

	/**
	 * 是否标记缺失翻译（某语言没有该 key 的翻译时，用特殊颜色高亮）
	 * @default true
	 */
	highlightMissing?: boolean

	/**
	 * 自定义语言列的顺序，未列出的语言追加到末尾
	 * 例如: ['zh-CN', 'en-US', 'ja-JP']
	 * 不传则按文件扫描顺序排列
	 */
	localeOrder?: string[]

	/**
	 * 语言列的中文备注，显示在 Excel 第二行
	 * 例如: { 'zh-CN': '中文', 'en-US': '英文', 'ja-JP': '日文' }
	 * 不传则不生成备注行
	 */
	localeLabels?: Record<string, string>
}

/**
 * 将嵌套对象展平为 "a.b.c" 格式的扁平 key-value map
 */
// export function flattenObject(
//   obj: Record<string, unknown>,
//   prefix = ''
// ): Record<string, string> {
//   const result: Record<string, string> = {}
//   for (const [k, v] of Object.entries(obj)) {
//     const fullKey = prefix ? `${prefix}.${k}` : k
//     if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
//       Object.assign(result, flattenObject(v as Record<string, unknown>, fullKey))
//     } else {
//       result[fullKey] = String(v ?? '')
//     }
//   }
//   return result
// }
// 改动后
export function flattenObject(
	obj: Record<string, unknown> | unknown[],
	prefix = ""
): Record<string, string> {
	const result: Record<string, string> = {}
	const entries = Array.isArray(obj)
		? obj.map((v, i) => [String(i), v] as [string, unknown])
		: Object.entries(obj)

	for (const [k, v] of entries) {
		const fullKey = prefix ? `${prefix}.${k}` : k
		if (Array.isArray(v)) {
			Object.assign(result, flattenObject(v, fullKey))
		} else if (v !== null && typeof v === "object") {
			Object.assign(result, flattenObject(v as Record<string, unknown>, fullKey))
		} else {
			result[fullKey] = String(v ?? "")
		}
	}
	return result
}

/**
 * 自动扫描目录下所有 .json 文件，返回语言名列表
 */
function detectLocales(localesDir: string): string[] {
	if (!fs.existsSync(localesDir)) return []
	return fs
		.readdirSync(localesDir)
		.filter((f) => f.endsWith(".json"))
		.map((f) => f.replace(".json", ""))
}

/**
 * 读取单个语言 JSON 文件，返回展平后的 key-value map
 */
function readLocaleJson(localesDir: string, locale: string): Record<string, string> {
	const filePath = path.join(localesDir, `${locale}.json`)
	if (!fs.existsSync(filePath)) {
		console.warn(`[i18n-excel] ⚠️  找不到语言文件: ${filePath}，该列将为空`)
		return {}
	}
	try {
		const raw = fs.readFileSync(filePath, "utf-8")
		const json = JSON.parse(raw)
		return flattenObject(json)
	} catch (e) {
		console.error(`[i18n-excel] ❌ 解析 JSON 失败: ${filePath}`, e)
		return {}
	}
}

/**
 * 读取现有 Excel 中的翻译数据（用于增量合并）
 * 返回 Map<key, Map<locale, value>>
 */
function readExistingExcel(excelPath: string, keyColumn: string): Map<string, Map<string, string>> {
	const result = new Map<string, Map<string, string>>()
	if (!fs.existsSync(excelPath)) return result

	try {
		const fileBuffer = fs.readFileSync(excelPath)
		const workbook = XLSX.read(fileBuffer, { type: "buffer", raw: false })
		const sheetName = workbook.SheetNames[0]
		const worksheet = workbook.Sheets[sheetName]
		const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
			defval: "",
			raw: false
		})

		for (const row of rows) {
			const key = row[keyColumn]?.trim()
			if (!key || key === HEADER_LABEL) continue
			const localeMap = new Map<string, string>()
			for (const [col, val] of Object.entries(row)) {
				if (col !== keyColumn) {
					localeMap.set(col, val)
				}
			}
			result.set(key, localeMap)
		}
	} catch (e) {
		console.warn(`[i18n-excel] ⚠️  读取现有 Excel 失败，将重新生成`, e)
	}

	return result
}

/**
 * 主函数：将 JSON 语言文件生成/合并到 Excel
 */
export function jsonToExcel(options: JsonToExcelOptions = {}, rootDir = process.cwd()) {
	const {
		localesDir = "src/locales",
		excelPath = "src/locales/translations.xlsx",
		keyColumn = "key",
		locales,
		mergeMode = "merge",
		highlightMissing = true,
		localeOrder,
		localeLabels
	} = options

	const absLocalesDir = path.resolve(rootDir, localesDir)
	const absExcelPath = path.resolve(rootDir, excelPath)

	// 1. 确定要处理的语言列表
	let targetLocales = locales ?? detectLocales(absLocalesDir)

	if (localeOrder && localeOrder.length > 0) {
		const localeSet = new Set(targetLocales)
		const ordered = localeOrder.filter((l) => localeSet.has(l))
		const rest = targetLocales.filter((l) => !localeOrder.includes(l))
		targetLocales = [...ordered, ...rest]
	}

	if (targetLocales.length === 0) {
		console.warn(`[i18n-excel] ⚠️  在 ${absLocalesDir} 下没有找到任何 .json 文件`)
		return
	}
	console.log(`[i18n-excel] 📂 检测到语言: ${targetLocales.join(", ")}`)

	// 2. 读取各语言 JSON
	const localeData = new Map<string, Record<string, string>>()
	for (const locale of targetLocales) {
		localeData.set(locale, readLocaleJson(absLocalesDir, locale))
	}

	// 3. 收集所有 key（以第一个语言文件为主顺序，其他语言补充缺失 key）
	const allKeysOrdered: string[] = []
	const allKeysSet = new Set<string>()

	// 先按第一个语言的 key 顺序排列
	const primaryLocale = targetLocales[0]
	for (const key of Object.keys(localeData.get(primaryLocale) ?? {})) {
		if (!allKeysSet.has(key)) {
			allKeysOrdered.push(key)
			allKeysSet.add(key)
		}
	}
	// 再补充其他语言有但主语言没有的 key
	for (const locale of targetLocales.slice(1)) {
		for (const key of Object.keys(localeData.get(locale) ?? {})) {
			if (!allKeysSet.has(key)) {
				allKeysOrdered.push(key)
				allKeysSet.add(key)
			}
		}
	}

	// 4. 增量合并：读取现有 Excel
	let existingData = new Map<string, Map<string, string>>()
	if (mergeMode === "merge") {
		existingData = readExistingExcel(absExcelPath, keyColumn)
		console.log(`[i18n-excel] 🔀 合并模式：现有 Excel 包含 ${existingData.size} 个 key`)

		// 将现有 Excel 中有但 JSON 里没有的 key 也加进来（保留已删除翻译的历史）
		for (const existingKey of existingData.keys()) {
			if (!allKeysSet.has(existingKey)) {
				allKeysOrdered.push(existingKey)
				allKeysSet.add(existingKey)
			}
		}
	}

	// 5. 构建最终的行数据
	const rows: Record<string, string>[] = []
	let newKeyCount = 0
	let missingTranslationCount = 0

	for (const key of allKeysOrdered) {
		const row: Record<string, string> = { [keyColumn]: key }
		const isNewKey = mergeMode === "merge" && !existingData.has(key)
		if (isNewKey) newKeyCount++

		for (const locale of targetLocales) {
			const jsonValue = localeData.get(locale)?.[key]

			if (mergeMode === "merge") {
				// 优先使用 JSON 中的最新值；JSON 没有则保留 Excel 中的旧值
				const excelValue = existingData.get(key)?.get(locale) ?? ""
				row[locale] = jsonValue !== undefined ? jsonValue : excelValue
			} else {
				row[locale] = jsonValue ?? ""
			}

			if (!row[locale]) missingTranslationCount++
		}

		rows.push(row)
	}

	if (localeLabels) {
		const labelRow: Record<string, string> = { [keyColumn]: HEADER_LABEL }
		for (const locale of targetLocales) {
			labelRow[locale] = localeLabels[locale] ?? locale
		}
		rows.unshift(labelRow)
	}

	// 6. 生成 Excel
	const worksheet = XLSX.utils.json_to_sheet(rows, {
		header: [keyColumn, ...targetLocales]
	})

	// 设置列宽
	worksheet["!cols"] = [
		{ wch: 35 }, // key 列
		...targetLocales.map(() => ({ wch: 20 }))
	]

	// 高亮缺失翻译的单元格（标记为黄色背景）
	if (highlightMissing) {
		const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1")
		// 注意：xlsx 免费版不支持样式，这里通过在空值前加 "⚠️" 标记缺失翻译
		for (let R = 1; R <= range.e.r; R++) {
			for (let C = 1; C <= range.e.c; C++) {
				const cellAddr = XLSX.utils.encode_cell({ r: R, c: C })
				const cell = worksheet[cellAddr]
				if (!cell || cell.v === "") {
					worksheet[cellAddr] = { t: "s", v: "【待翻译】" }
				}
			}
		}
	}

	const workbook = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(workbook, worksheet, "translations")

	const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
	// 确保输出目录存在
	const outputDir = path.dirname(absExcelPath)
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true })
	}

	// fs.writeFileSync()
	fs.writeFileSync(absExcelPath, excelBuffer)
	// XLSX.writeFile(workbook, )

	console.log(`[i18n-excel] ✅ Excel 已生成: ${absExcelPath}`)
	console.log(
		`[i18n-excel] 📊 统计: 共 ${allKeysOrdered.length} 个 key，新增 ${newKeyCount} 个，缺失翻译 ${missingTranslationCount} 处`
	)
}
