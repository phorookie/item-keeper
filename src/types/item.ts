// 物品类型定义
export interface Item {
  id: string
  name: string
  category: string
  subCategory: string
  brand?: string
  price?: number
  purchaseDate: string
  // 效期相关
  produceDate?: string       // 生产日期
  shelfLife?: string         // 保质期时长，如 "2年" "6个月"
  shelfLifeDays?: number     // 保质期天数（自动计算）
  expireDate?: string        // 到期日（自动计算）
  expireDays?: number        // 距离过期还有多少天
  isExpiringSoon?: boolean   // 是否即将过期（60天内）
  // 开封相关
  openDate?: string          // 开封日期
  openExpireDays?: number    // 开封后剩余天数
  // 其他
  tags: string[]
  note?: string
  images: string[]           // 图片路径列表
  createdAt: number
  updatedAt: number
  status: 'active' | 'used' | 'expired'
}

// 分类
export interface Category {
  id: string
  name: string
  icon?: string
  subCategories?: string[]
}

// 列表筛选条件
export interface ItemFilter {
  keyword?: string
  category?: string
  tag?: string
  status?: Item['status']
  onlyExpiring?: boolean
}
