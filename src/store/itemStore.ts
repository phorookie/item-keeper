// 物品数据 store
import Taro from '@tarojs/taro'
import { Item, ItemFilter } from '../types/item'
import { getStorage, setStorage } from '../utils/storage'
import { daysUntil, isExpiringSoon, generateId, today, calcExpireDate, parseShelfLife } from '../utils/date'

// 预设分类
export const categories = [
  { name: '护肤品', subCategories: ['洁面', '水', '精华', '乳液', '面霜', '面膜', '防晒', '其他'] },
  { name: '保健品', subCategories: ['维生素', '益生菌', '鱼油', '蛋白粉', '其他'] },
  { name: '食品', subCategories: ['零食', '调料', '饮料', '其他'] },
  { name: '日用品', subCategories: ['清洁', '纸巾', '洗护', '其他'] },
  { name: '衣物鞋包', subCategories: ['上衣', '下装', '鞋子', '包包', '其他'] },
  { name: '数码家电', subCategories: ['手机配件', '电脑配件', '小家电', '其他'] },
  { name: '其他', subCategories: ['未分类'] },
]

// 预设标签推荐
export const presetTags = [
  '美白', '补水', '清洁', '保湿', '抗衰', '修复', '控油', '提亮',
  '维生素', '益生菌', '增强免疫', '肠道', '心脑血管',
  '温和', '氨基酸', '棉柔',
  '提神', '助眠',
]

// Mock 初始数据
const mockItems: Item[] = [
  {
    id: '1',
    name: '氨基酸洗面奶',
    category: '护肤品',
    subCategory: '洁面',
    brand: '芙丽芳丝',
    price: 99,
    purchaseDate: '2026-05-10',
    produceDate: '2025-06-15',
    shelfLife: '3年',
    shelfLifeDays: 1095,
    expireDate: '2028-06-14',
    expireDays: 620,
    isExpiringSoon: false,
    tags: ['清洁', '温和', '氨基酸'],
    note: '早晚都可用，起泡丰富，洗完不紧绷。',
    images: [],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 30,
    status: 'active',
  },
  {
    id: '2',
    name: '深海鱼油',
    category: '保健品',
    subCategory: '鱼油',
    brand: '汤臣倍健',
    price: 168,
    purchaseDate: '2026-02-20',
    produceDate: '2024-11-20',
    shelfLife: '2年',
    shelfLifeDays: 730,
    expireDate: '2026-11-19',
    expireDays: 50,
    isExpiringSoon: true,
    tags: ['Omega-3', '心脑血管'],
    note: '每天一粒，饭后服用。',
    images: [],
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 60,
    status: 'active',
  },
  {
    id: '3',
    name: '烟酰胺原液',
    category: '护肤品',
    subCategory: '精华',
    brand: 'HFP',
    price: 189,
    purchaseDate: '2026-03-15',
    produceDate: '2025-07-01',
    shelfLife: '2年',
    shelfLifeDays: 730,
    expireDate: '2027-06-30',
    expireDays: 272,
    isExpiringSoon: false,
    openDate: '2026-08-01',
    openExpireDays: 30,
    tags: ['美白', '淡斑', '提亮'],
    note: '晚上使用，每次 3-4 滴，搭配面霜效果更好。注意避光，白天使用需要涂防晒。',
    images: [],
    createdAt: Date.now() - 86400000 * 45,
    updatedAt: Date.now() - 86400000 * 45,
    status: 'active',
  },
  {
    id: '4',
    name: '维生素C片',
    category: '保健品',
    subCategory: '维生素',
    brand: '善存',
    price: 79,
    purchaseDate: '2026-01-15',
    produceDate: '2024-10-15',
    shelfLife: '2年',
    shelfLifeDays: 730,
    expireDate: '2026-10-14',
    expireDays: 13,
    isExpiringSoon: true,
    tags: ['维C', '增强免疫'],
    note: '每天一片，早餐后吃。',
    images: [],
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now() - 86400000 * 90,
    status: 'active',
  },
  {
    id: '5',
    name: '纯棉洗脸巾',
    category: '日用品',
    subCategory: '清洁',
    brand: '全棉时代',
    price: 49,
    purchaseDate: '2026-06-01',
    expireDays: -1,
    isExpiringSoon: false,
    tags: ['清洁', '棉柔'],
    note: '',
    images: [],
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 15,
    status: 'active',
  },
  {
    id: '6',
    name: '益生菌粉',
    category: '保健品',
    subCategory: '益生菌',
    brand: 'Life Space',
    price: 238,
    purchaseDate: '2026-04-20',
    produceDate: '2025-02-10',
    shelfLife: '2年',
    shelfLifeDays: 730,
    expireDate: '2027-02-09',
    expireDays: 131,
    isExpiringSoon: false,
    tags: ['肠道', '益生菌'],
    note: '冷藏保存，每天一袋。',
    images: [],
    createdAt: Date.now() - 86400000 * 40,
    updatedAt: Date.now() - 86400000 * 40,
    status: 'active',
  },
]

class ItemStore {
  private items: Item[] = []
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    const data = await getStorage()
    if (data.items && data.items.length > 0) {
      this.items = data.items.map(this.calculateItemStatus)
    } else {
      // 首次使用，加载 mock 数据
      this.items = mockItems.map(this.calculateItemStatus)
      await this.save()
    }

    this.initialized = true
  }

  private calculateItemStatus(item: Item): Item {
    const days = item.expireDate ? daysUntil(item.expireDate) : -1
    return {
      ...item,
      expireDays: days,
      isExpiringSoon: days >= 0 && days <= 60,
      status: days < 0 && item.expireDate ? 'expired' : item.status,
    }
  }

  private async save(): Promise<void> {
    await setStorage({ items: this.items, version: 1 })
  }

  getAll(): Item[] {
    return this.items.filter(i => i.status === 'active')
  }

  getById(id: string): Item | undefined {
    return this.items.find(i => i.id === id)
  }

  getExpiringSoon(): Item[] {
    return this.items.filter(i => i.status === 'active' && i.isExpiringSoon)
  }

  search(filter: ItemFilter): Item[] {
    let results = this.items.filter(i => i.status === 'active')

    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      results = results.filter(
        item =>
          item.name.toLowerCase().includes(kw) ||
          item.tags.some(t => t.toLowerCase().includes(kw)) ||
          item.category.toLowerCase().includes(kw) ||
          item.brand?.toLowerCase().includes(kw)
      )
    }

    if (filter.category) {
      results = results.filter(i => i.category === filter.category)
    }

    if (filter.tag) {
      results = results.filter(i => i.tags.includes(filter.tag!))
    }

    if (filter.onlyExpiring) {
      results = results.filter(i => i.isExpiringSoon)
    }

    return results.sort((a, b) => b.createdAt - a.createdAt)
  }

  async add(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'expireDays' | 'isExpiringSoon'>): Promise<Item> {
    // 如果有生产日期和保质期，自动计算到期日
    let expireDate = itemData.expireDate
    let shelfLifeDays = itemData.shelfLifeDays
    if (itemData.produceDate && itemData.shelfLife && !expireDate) {
      const months = parseShelfLife(itemData.shelfLife)
      if (months > 0) {
        expireDate = calcExpireDate(itemData.produceDate, months)
        shelfLifeDays = months * 30
      }
    }

    const newItem: Item = {
      ...itemData,
      expireDate,
      shelfLifeDays,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active',
    }
    const calculated = this.calculateItemStatus(newItem)
    this.items.unshift(calculated)
    await this.save()
    return calculated
  }

  async update(id: string, updates: Partial<Item>): Promise<Item | undefined> {
    const idx = this.items.findIndex(i => i.id === id)
    if (idx === -1) return undefined

    // 如果更新了生产日期或保质期，重新计算到期日
    let expireDate = updates.expireDate ?? this.items[idx].expireDate
    let shelfLifeDays = updates.shelfLifeDays ?? this.items[idx].shelfLifeDays
    const produceDate = updates.produceDate ?? this.items[idx].produceDate
    const shelfLife = updates.shelfLife ?? this.items[idx].shelfLife

    if (produceDate && shelfLife) {
      const months = parseShelfLife(shelfLife)
      if (months > 0) {
        expireDate = calcExpireDate(produceDate, months)
        shelfLifeDays = months * 30
      }
    }

    const updated = {
      ...this.items[idx],
      ...updates,
      expireDate,
      shelfLifeDays,
      updatedAt: Date.now(),
    }
    const calculated = this.calculateItemStatus(updated)
    this.items[idx] = calculated
    await this.save()
    return calculated
  }

  async markUsed(id: string): Promise<boolean> {
    const idx = this.items.findIndex(i => i.id === id)
    if (idx === -1) return false
    this.items[idx].status = 'used'
    this.items[idx].updatedAt = Date.now()
    await this.save()
    return true
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.items.findIndex(i => i.id === id)
    if (idx === -1) return false
    this.items.splice(idx, 1)
    await this.save()
    return true
  }

  getStats() {
    const active = this.items.filter(i => i.status === 'active')
    const expiring = active.filter(i => i.isExpiringSoon)
    const categories = new Set(active.map(i => i.category))
    return {
      total: active.length,
      expiring: expiring.length,
      categories: categories.size,
    }
  }
}

export const itemStore = new ItemStore()
