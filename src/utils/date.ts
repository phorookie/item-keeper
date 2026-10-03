// 日期工具函数

/**
 * 计算距离目标日期还有多少天
 */
export function daysUntil(dateStr: string): number {
  if (!dateStr) return -1
  const target = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * 判断是否即将过期（60天内）
 */
export function isExpiringSoon(dateStr: string): boolean {
  const days = daysUntil(dateStr)
  return days >= 0 && days <= 60
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 获取今天的日期字符串
 */
export function today(): string {
  return formatDate(new Date())
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6)
}

// 保质期预设选项
export const shelfLifeOptions = [
  { label: '6个月', months: 6 },
  { label: '1年', months: 12 },
  { label: '2年', months: 24 },
  { label: '3年', months: 36 },
  { label: '5年', months: 60 },
]

/**
 * 根据生产日期和保质期月数，计算到期日
 */
export function calcExpireDate(produceDate: string, months: number): string {
  if (!produceDate) return ''
  const date = new Date(produceDate)
  date.setMonth(date.getMonth() + months)
  // 减一天（比如生产日期1月1日+6个月=6月30日到期）
  date.setDate(date.getDate() - 1)
  return formatDate(date)
}

/**
 * 解析保质期字符串为月数
 */
export function parseShelfLife(shelfLife: string): number {
  const matchYear = shelfLife.match(/(\d+)\s*年/)
  if (matchYear) return parseInt(matchYear[1]) * 12

  const matchMonth = shelfLife.match(/(\d+)\s*个月?/)
  if (matchMonth) return parseInt(matchMonth[1])

  return 0
}
