/**
 * 展示层格式化工具。
 *
 * 平台规则：后端拿不到真实值时返回 null，前端统一显示「--」，
 * 不得用示例值或占位数字冒充真实数据。
 */

export const PLACEHOLDER = '--'

/** 数字类：null/undefined/NaN 一律显示 --，否则按固定小数位显示 */
export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return PLACEHOLDER
  return value.toFixed(digits)
}

/** 整数类 */
export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return PLACEHOLDER
  return String(Math.round(value))
}

/** 带单位：值为空时只显示 --，避免出现 "-- m" 这类脏输出 */
export function formatWithUnit(
  value: number | null | undefined,
  unit: string,
  digits = 2,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return PLACEHOLDER
  return `${value.toFixed(digits)} ${unit}`
}

/** 通用：字符串类空值处理 */
export function formatText(value: string | null | undefined): string {
  if (value === null || value === undefined) return PLACEHOLDER
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : PLACEHOLDER
}

/** 坐标三元组：x / y / yaw，任一为空则整体显示 -- */
export function formatPose(
  pose: { x: number | null; y: number | null; yaw: number | null } | null | undefined,
): string {
  if (!pose) return PLACEHOLDER
  if (pose.x === null || pose.y === null) return PLACEHOLDER
  const yaw = pose.yaw === null ? PLACEHOLDER : `${pose.yaw.toFixed(1)}°`
  return `(${pose.x.toFixed(2)}, ${pose.y.toFixed(2)}, ${yaw}) m`
}

/** 电量：0-100，未确认时显示 -- */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return PLACEHOLDER
  return `${Math.round(value)}%`
}

/** 时间戳 → HH:mm:ss */
export function formatClock(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 2026-09-29 星期二 */
export function formatDate(date: Date): string {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}年${m}月${d}日 ${weekdays[date.getDay()]}`
}

/** 相对时间：刚刚 / N 分钟前 / HH:mm */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime()
  if (Number.isNaN(diff)) return PLACEHOLDER
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  return new Date(iso).toLocaleTimeString('zh-CN', { hour12: false })
}

/** 运行时长：秒 → 12 天 6 小时 */
export function formatUptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return PLACEHOLDER
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days} 天 ${hours} 小时`
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`
  return `${minutes} 分钟`
}
