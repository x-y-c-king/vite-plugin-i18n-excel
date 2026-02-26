import { jsonToExcel } from "vite-plugin-i18n-excel"
import { resolve } from "path"

jsonToExcel({
	localesDir: resolve(__dirname, "./json"), // './json',
	excelPath: resolve(__dirname, "./excel/translations.xlsx"),
	localeOrder: ["zh", "en_old", "en", "ko", "ja", "zh-Hant", "fr", "de", "es", "pt", "id", "vi"],
  mergeMode: "merge",
  localeLabels: {
    "en": '英文',
    'zh': '中文',
    'ja': '日文',
    'ko': '韩文',
    "zh-Hant": "繁体中文",
    "fr": "法文",
    "de": "德文",
    "es": "西班牙文",
    "pt": "葡萄牙文",
    "id": "印度尼西亚文",
    "vi": "越南文"
  }
})
