type MergeArrayCallback = (targetArr: any[], sourceArr: any[]) => any[]

type R = Record<string, any>

/**
 * 判断值是否为纯对象（排除数组、null 等）
 */
function isObject(value: any) {
	return Object.prototype.toString.call(value) === "[object Object]"
}

/**
 * 深度合并两个对象，支持自定义数组合并策略
 *
 * @template T - 目标对象类型，必须是 Record<string, any>
 * @template S - 源对象类型，必须是 Record<string, any>
 *
 * @param target - 目标对象，合并的基础对象，原对象不会被修改
 * @param source - 源对象，其属性将被合并到目标对象中
 * @param mergeArray - 可选的数组合并回调，接收 (targetArr, sourceArr) 并返回合并后的数组。
 *                     不传则直接用源数组覆盖目标数组
 *
 * @returns 合并后的新对象，类型为 T & S
 *
 * @example
 * // 基础用法：对象深度合并
 * const a = { x: 1, nested: { y: 2, z: 3 } }
 * const b = { nested: { y: 99 }, extra: 'new' }
 * deepMerge(a, b)
 * // → { x: 1, nested: { y: 99, z: 3 }, extra: 'new' }
 *
 * @example
 * // 自定义数组合并：合并去重
 * const a = { tags: [1, 2, 3] }
 * const b = { tags: [3, 4, 5] }
 * deepMerge(a, b, (target, source) => [...new Set([...target, ...source])])
 * // → { tags: [1, 2, 3, 4, 5] }
 *
 * @example
 * // 不传 mergeArray：源数组直接覆盖目标数组
 * const a = { tags: [1, 2, 3] }
 * const b = { tags: [4, 5] }
 * deepMerge(a, b)
 * // → { tags: [4, 5] }
 */
export const deepMerge = <T extends R, S extends R>(
	target: T,
	source: S,
	mergeArray?: MergeArrayCallback
): T & S => {
	const merged: R = { ...target }

	for (const key in source) {
		if (source.hasOwnProperty(key)) {
			const targetValue = merged[key]
			const sourceValue = source[key]

			if (isObject(sourceValue) && !Array.isArray(sourceValue)) {
				// 源值是纯对象：递归深度合并
				if (!isObject(targetValue) || Array.isArray(targetValue)) {
					// 目标不是对象，先重置为空对象再合并
					merged[key] = {}
				}
				merged[key] = deepMerge(merged[key], sourceValue, mergeArray)
			} else if (Array.isArray(sourceValue)) {
				// 源值是数组：使用自定义回调或直接覆盖
				merged[key] = mergeArray
					? mergeArray(Array.isArray(targetValue) ? targetValue : [], sourceValue)
					: sourceValue
			} else {
				// 源值是基本类型：直接覆盖
				merged[key] = sourceValue
			}
		}
	}

	return merged as T & S
}