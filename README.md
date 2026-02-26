# vite-plugin-i18n-excel

从 Excel 自动生成 vue-i18n 语言 JSON 文件的 Vite 插件。

## Excel 格式

第一行为列标题，第一列固定为 `key`，第二列可配置自定义语言备注 其余列为语言标识：

| key | zh-CN | en-US | ja-JP |
|-----|-------|-------|-------|
| common.confirm | 确认 | Confirm | 確認 |
| common.cancel | 取消 | Cancel | キャンセル |
| nav.home | 首页 | Home | ホーム |
| user.login | 登录 | Login | ログイン |

> key 中的 `.` 会被解析为嵌套对象（可通过 `nestedKeys: false` 关闭）

## 安装

```bash
npm install vite-plugin-i18n-excel -D
```

## 使用

### 1. 配置 vite.config.ts

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { i18nExcelPlugin } from 'vite-plugin-i18n-excel'

export default defineConfig({
  plugins: [
    vue(),
    i18nExcelPlugin({
      excelPath: 'src/locales/translations.xlsx', // Excel 路径
      outputDir: 'src/locales/json',                   // JSON 输出目录
      keyColumn: 'key',                           // key 列的列名
      nestedKeys: true,                           // 支持 a.b.c 嵌套
      sheetName: 0,                               // 读取第几个 Sheet
      ignoreRow: 1,                               // 忽略前1行 （2就是忽略前2行）
      localeMap: { en_old: 'en' },                // 重写语言映射 如果有两列 en_old和en，en列没有值的时候，会使用 en_old列的值
    })
  ]
})
```

### 2. 配置 vue-i18n（src/locales/index.ts）

```ts
import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN.json'  // 插件自动生成 对应的key行值
import enUS from './en-US.json'  // 插件自动生成

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  }
})

export default i18n
```

### 3. 在 main.ts 中注册

```ts
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './locales'

createApp(App).use(i18n).mount('#app')
```

### 4. 在组件中使用

```vue
<template>
  <div>
    <p>{{ t('common.confirm') }}</p>
    <p>{{ t('nav.home') }}</p>

    <!-- 切换语言 -->
    <button @click="locale = 'en-US'">English</button>
    <button @click="locale = 'zh-CN'">中文</button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
</script>
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `excelPath` | `string` | `'src/locales/translations.xlsx'` | Excel 文件路径（相对于项目根目录） |
| `outputDir` | `string` | `'src/locales'` | JSON 文件输出目录 |
| `keyColumn` | `string` | `'key'` | Excel 中 key 列的标题 |
| `nestedKeys` | `boolean` | `true` | 是否将 `a.b.c` 解析为嵌套对象 |
| `sheetName` | `string \| number` | `0` | 读取的 Sheet（索引或名称） |
| `onGenerated` | `function` | - | 生成完成后的回调函数 |
| `ignoreRow` | `number` | `1` | 忽略的行数（通常是标题行） |
| `localeMap` | `Record<string, string>` | - | 重写语言映射的 key（例如：{ en_old: 'en' }） |

## 工作原理

1. **启动时**：Vite 启动时插件自动读取 Excel，生成各语言 JSON 文件
2. **Watch 模式**：开发时修改 Excel 文件，插件自动重新生成并触发页面热更新
3. **Build 时**：打包前自动生成最新的语言文件

##
##
**========================================================================**
##
##


##  使用项目中的json 生成 Excel

1. **新建文件**：在项目根目录下新建 `src/locales/create-excel.ts` 文件，并写入以下代码：(根据项目填写配置)

```typescript
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
```



2. **运行命令**：在项目根目录下执行以下命令，生成 Excel 文件
   
```bash
npx ts-node src/locales/create-excel.ts
```

## 配置项
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `localesDir` | `string` | `'src/locales'` |  JSON 文件所在目录 |
| `excelPath` | `string` | `'src/locales/translations.xlsx` | 输出的 Excel 文件路径 |
| `keyColumn` | `string` | `'key'` | Excel 中 key 列的标题 |
| `locales` | `Array<string>` | `-` | 指定要扫描的语言列表，不填则自动扫描目录下所有 .json 文件 |
| `mergeMode` | `merge \| overwrite` | `merge` | 合并模式： 'overwrite': 完全覆盖重新生成，'merge': 增量合并（已有翻译保留，新 key 追加到末尾） |
| `highlightMissing` | `boolean` | `true` | 是否标记缺失翻译 |
| `localeOrder` | `Array<string>` | `[]` | 自定义语言列的顺序，未列出的语言追加到末尾 |
| `localeLabels` | `Record<string, string>` | - | 语言列的中文备注，显示在 Excel 第二行 |


