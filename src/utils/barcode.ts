// 条码查询服务（前端直接调用第三方 API）
import Taro from '@tarojs/taro'
import { parseShelfLife, shelfLifeOptions } from './date'

export interface BarcodeProduct {
  name: string
  brand: string
  category: string
  subCategory: string
  spec: string
  image: string
  shelfLife: string
  shelfLifeMonths: number
  manufacturer: string
  origin: string
  price: number | null
  barcode: string
  source: string
  tags: string[]
}

// TODO: 替换为你自己的 API Key
// 注册地址：https://www.tanshuapi.com
const API_KEY = '0008d82e0b55882c3e02df5ee0a2c0fc'

/**
 * 分类关键词映射表
 * 把 API 返回的各种分类名称，映射到我们的标准分类
 */
const categoryMap: Record<string, { category: string; subCategory: string }> = {
  // 护肤品
  '护肤': { category: '护肤品', subCategory: '其他' },
  '化妆品': { category: '护肤品', subCategory: '其他' },
  '洁面': { category: '护肤品', subCategory: '洁面' },
  '洗面奶': { category: '护肤品', subCategory: '洁面' },
  '爽肤水': { category: '护肤品', subCategory: '水' },
  '化妆水': { category: '护肤品', subCategory: '水' },
  '精华': { category: '护肤品', subCategory: '精华' },
  '精华液': { category: '护肤品', subCategory: '精华' },
  '乳液': { category: '护肤品', subCategory: '乳液' },
  '面霜': { category: '护肤品', subCategory: '面霜' },
  '面膜': { category: '护肤品', subCategory: '面膜' },
  '防晒': { category: '护肤品', subCategory: '防晒' },
  '防晒霜': { category: '护肤品', subCategory: '防晒' },
  '口红': { category: '护肤品', subCategory: '其他' },
  '唇膏': { category: '护肤品', subCategory: '其他' },
  // 保健品/药品
  '保健': { category: '保健品', subCategory: '其他' },
  '保健食品': { category: '保健品', subCategory: '其他' },
  '维生素': { category: '保健品', subCategory: '维生素' },
  '益生菌': { category: '保健品', subCategory: '益生菌' },
  '鱼油': { category: '保健品', subCategory: '鱼油' },
  '蛋白粉': { category: '保健品', subCategory: '蛋白粉' },
  '钙片': { category: '保健品', subCategory: '其他' },
  '药品': { category: '保健品', subCategory: '其他' },
  '医药': { category: '保健品', subCategory: '其他' },
  // 食品
  '食品': { category: '食品', subCategory: '其他' },
  '饮料': { category: '食品', subCategory: '饮料' },
  '饮品': { category: '食品', subCategory: '饮料' },
  '零食': { category: '食品', subCategory: '零食' },
  '饼干': { category: '食品', subCategory: '零食' },
  '巧克力': { category: '食品', subCategory: '零食' },
  '糖果': { category: '食品', subCategory: '零食' },
  '调料': { category: '食品', subCategory: '调料' },
  '调味品': { category: '食品', subCategory: '调料' },
  '酱油': { category: '食品', subCategory: '调料' },
  '醋': { category: '食品', subCategory: '调料' },
  '牛奶': { category: '食品', subCategory: '饮料' },
  '酸奶': { category: '食品', subCategory: '饮料' },
  '方便食品': { category: '食品', subCategory: '其他' },
  '粮油': { category: '食品', subCategory: '其他' },
  // 日用品
  '日用': { category: '日用品', subCategory: '其他' },
  '日用品': { category: '日用品', subCategory: '其他' },
  '洗护': { category: '日用品', subCategory: '洗护' },
  '洗发水': { category: '日用品', subCategory: '洗护' },
  '沐浴露': { category: '日用品', subCategory: '洗护' },
  '牙膏': { category: '日用品', subCategory: '洗护' },
  '清洁': { category: '日用品', subCategory: '清洁' },
  '洗衣液': { category: '日用品', subCategory: '清洁' },
  '洗洁精': { category: '日用品', subCategory: '清洁' },
  '纸巾': { category: '日用品', subCategory: '纸巾' },
  '卫生纸': { category: '日用品', subCategory: '纸巾' },
  '抽纸': { category: '日用品', subCategory: '纸巾' },
  // 数码家电
  '数码': { category: '数码家电', subCategory: '其他' },
  '手机': { category: '数码家电', subCategory: '手机配件' },
  '电脑': { category: '数码家电', subCategory: '电脑配件' },
  '家电': { category: '数码家电', subCategory: '小家电' },
  '电器': { category: '数码家电', subCategory: '小家电' },
  // 衣物鞋包
  '服装': { category: '衣物鞋包', subCategory: '上衣' },
  '服饰': { category: '衣物鞋包', subCategory: '上衣' },
  '鞋': { category: '衣物鞋包', subCategory: '鞋子' },
  '鞋类': { category: '衣物鞋包', subCategory: '鞋子' },
  '箱包': { category: '衣物鞋包', subCategory: '包包' },
  '包': { category: '衣物鞋包', subCategory: '包包' },
}

/**
 * 根据 API 返回的分类名称，智能匹配到我们的标准分类
 */
function matchCategory(apiCategory: string): { category: string; subCategory: string } {
  if (!apiCategory) return { category: '其他', subCategory: '未分类' }

  // 先尝试精确匹配
  if (categoryMap[apiCategory]) {
    return categoryMap[apiCategory]
  }

  // 再尝试关键词包含匹配（长的优先匹配，避免"保健"先于"保健食品"匹配）
  const keys = Object.keys(categoryMap).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (apiCategory.includes(key)) {
      return categoryMap[key]
    }
  }

  return { category: '其他', subCategory: '未分类' }
}

/**
 * 根据商品名称和分类，推荐相关标签
 */
function recommendTags(name: string, category: string): string[] {
  const tags: string[] = []
  const nameLower = name.toLowerCase()

  // 护肤品相关标签
  if (category === '护肤品') {
    if (nameLower.includes('美白')) tags.push('美白')
    if (nameLower.includes('补水') || nameLower.includes('保湿')) tags.push('补水', '保湿')
    if (nameLower.includes('抗衰') || nameLower.includes('抗老') || nameLower.includes('紧致')) tags.push('抗衰')
    if (nameLower.includes('修复') || nameLower.includes('修护')) tags.push('修复')
    if (nameLower.includes('清洁')) tags.push('清洁')
    if (nameLower.includes('氨基酸')) tags.push('氨基酸')
    if (nameLower.includes('温和')) tags.push('温和')
    if (nameLower.includes('提亮') || nameLower.includes('亮肤')) tags.push('提亮')
    if (nameLower.includes('控油')) tags.push('控油')
  }

  // 保健品相关标签
  if (category === '保健品') {
    if (nameLower.includes('维生素') || nameLower.includes('维c') || nameLower.includes('维e')) tags.push('维生素')
    if (nameLower.includes('益生菌')) tags.push('益生菌')
    if (nameLower.includes('免疫')) tags.push('增强免疫')
    if (nameLower.includes('肠道') || nameLower.includes('肠胃')) tags.push('肠道')
    if (nameLower.includes('鱼油')) tags.push('鱼油')
    if (nameLower.includes('蛋白')) tags.push('蛋白粉')
    if (nameLower.includes('心脑') || nameLower.includes('血管')) tags.push('心脑血管')
  }

  // 食品相关标签
  if (category === '食品') {
    if (nameLower.includes('提神') || nameLower.includes('咖啡')) tags.push('提神')
    if (nameLower.includes('助眠') || nameLower.includes('安神')) tags.push('助眠')
  }

  return tags
}

/**
 * 根据保质期月数，找到最接近的选项索引
 */
function matchShelfLifeIndex(months: number): number {
  if (months <= 0) return -1

  // 找差值最小的选项
  let minDiff = Infinity
  let minIndex = -1

  shelfLifeOptions.forEach((opt, idx) => {
    const diff = Math.abs(opt.months - months)
    if (diff < minDiff) {
      minDiff = diff
      minIndex = idx
    }
  })

  // 差值在 2 个月以内才认为匹配成功
  return minDiff <= 2 ? minIndex : -1
}

/**
 * 调起扫码
 */
export async function scanBarcode(): Promise<string | null> {
  try {
    const res = await Taro.scanCode({
      scanType: ['barCode', 'qrCode'],
      onlyFromCamera: false,
    })
    return res.result || null
  } catch (err) {
    console.warn('扫码取消或失败:', err)
    return null
  }
}

/**
 * 查询条码商品信息
 * 前端直接调用探数数据 API
 */
export async function queryBarcode(barcode: string): Promise<BarcodeProduct | null> {
  if (!barcode) return null

  // 如果还没配置 API Key，返回 null
  if (!API_KEY || API_KEY === 'your-api-key-here') {
    console.warn('请先配置条码 API Key')
    return null
  }

  try {
    const res = await Taro.request({
      url: `https://api.tanshuapi.com/api/barcode/v1/index`,
      data: {
        key: API_KEY,
        barcode,
      },
      method: 'GET',
      header: {
        'content-type': 'application/json',
      },
    })

    const result = res.data as any

    if (result.code === 1 && result.data) {
      const apiCategory = result.data.category_name || ''
      const { category, subCategory } = matchCategory(apiCategory)
      const shelfLifeStr = result.data.shelf_life || ''
      const shelfLifeMonths = parseShelfLife(shelfLifeStr)
      const productName = result.data.goods_name || ''
      const tags = recommendTags(productName, category)

      return {
        name: productName,
        brand: result.data.brand || result.data.trademark || '',
        category,
        subCategory,
        spec: result.data.spec || '',
        image: result.data.image || '',
        shelfLife: shelfLifeStr,
        shelfLifeMonths,
        manufacturer: result.data.company || result.data.manu_name || '',
        origin: result.data.origin_country || '',
        price: result.data.price ? Number(result.data.price) : null,
        barcode: result.data.barcode || barcode,
        source: 'tanshuapi',
        tags,
      }
    }

    console.warn('条码查询失败:', result.msg || result)
    return null
  } catch (err) {
    console.error('调用条码 API 失败:', err)
    return null
  }
}

export { matchCategory, matchShelfLifeIndex, recommendTags }

/**
 * 扫码并查询商品信息
 */
export async function scanAndQuery(): Promise<{
  barcode: string | null
  product: BarcodeProduct | null
}> {
  const barcode = await scanBarcode()
  if (!barcode) {
    return { barcode: null, product: null }
  }

  const product = await queryBarcode(barcode)
  return { barcode, product }
}
