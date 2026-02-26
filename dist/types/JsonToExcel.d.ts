export interface JsonToExcelOptions {
    /**
     * 语言 JSON 文件所在目录
     * @default 'src/locales'
     */
    localesDir?: string;
    /**
     * 输出的 Excel 文件路径
     * @default 'src/locales/translations.xlsx'
     */
    excelPath?: string;
    /**
     * key 列的列名
     * @default 'key'
     */
    keyColumn?: string;
    /**
     * 指定要扫描的语言列表，不填则自动扫描目录下所有 .json 文件
     * 例如: ['zh-CN', 'en-US']
     */
    locales?: string[];
    /**
     * 合并模式：
     * - 'overwrite': 完全覆盖重新生成
     * - 'merge': 增量合并（已有翻译保留，新 key 追加到末尾）
     * @default 'merge'
     */
    mergeMode?: "overwrite" | "merge";
    /**
     * 是否标记缺失翻译（某语言没有该 key 的翻译时，用特殊颜色高亮）
     * @default true
     */
    highlightMissing?: boolean;
    /**
     * 自定义语言列的顺序，未列出的语言追加到末尾
     * 例如: ['zh-CN', 'en-US', 'ja-JP']
     * 不传则按文件扫描顺序排列
     */
    localeOrder?: string[];
    /**
     * 语言列的中文备注，显示在 Excel 第二行
     * 例如: { 'zh-CN': '中文', 'en-US': '英文', 'ja-JP': '日文' }
     * 不传则不生成备注行
     */
    localeLabels?: Record<string, string>;
}
/**
 * 将嵌套对象展平为 "a.b.c" 格式的扁平 key-value map
 */
export declare function flattenObject(obj: Record<string, unknown> | unknown[], prefix?: string): Record<string, string>;
/**
 * 主函数：将 JSON 语言文件生成/合并到 Excel
 */
export declare function jsonToExcel(options?: JsonToExcelOptions, rootDir?: string): void;
