import type { Plugin } from "vite";
import { jsonToExcel, type JsonToExcelOptions } from './JsonToExcel';
import { deepMerge } from './deepMerge';
export interface I18nExcelOptions {
    /**
     * Excel 文件路径（相对于项目根目录）
     * @default 'src/locales/translations.xlsx'
     */
    excelPath?: string;
    /**
     * 生成的语言 JSON 文件输出目录
     * @default 'src/locales'
     */
    outputDir?: string;
    /**
     * Excel 中哪一个 Sheet（工作表名或索引）
     * @default 0（第一个 Sheet）
     */
    sheetName?: string | number;
    /**
     * key 所在列的列名（Excel 列标题）
     * @default 'key'
     */
    keyColumn?: string;
    /**
     * 是否将 key 中的 "." 解析为嵌套对象
     * 例如 "common.confirm" → { common: { confirm: '...' } }
     * @default true
     */
    nestedKeys?: boolean;
    /**
     * 忽略多少行（通常是标题行） 默认值 1 忽略第一行标题行，如果有其他标题行，请自行调整
     */
    ignoreRow?: number;
    /**
     * 重写语言映射的key
     * 例如 { en_old: 'en }
     * 当 (key | zh | en_old | en) 为这样的时候en列没有值的时候，会使用 en_old列的值，同时不会生成en_old.json文件
     */
    localeMap?: Record<string, string>;
    /**
     * 生成文件后的回调
     */
    onGenerated?: (files: GeneratedFile[]) => void;
}
export interface GeneratedFile {
    locale: string;
    filePath: string;
    data: Record<string, unknown>;
}
/**
 * 解析 Excel 文件，返回各语言的翻译对象
 */
export declare function parseExcel(excelPath: string, options: Pick<I18nExcelOptions, "sheetName" | "keyColumn" | "nestedKeys" | "ignoreRow" | "localeMap">): Map<string, Record<string, unknown>>;
/**
 * Vite 插件主体
 */
export declare function i18nExcelPlugin(options?: I18nExcelOptions): Plugin;
export { jsonToExcel, type JsonToExcelOptions, deepMerge };
export default i18nExcelPlugin;
