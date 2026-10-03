// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 条码查询云函数
// 1. 先查本地缓存数据库
// 2. 查不到则调用第三方 API
// 3. 查询结果存入缓存
exports.main = async (event, context) => {
  const { barcode } = event

  if (!barcode) {
    return {
      success: false,
      message: '条码号不能为空'
    }
  }

  try {
    // 第一步：先查缓存
    const cacheResult = await db.collection('barcode_cache')
      .where({ barcode })
      .get()

    if (cacheResult.data.length > 0) {
      const cached = cacheResult.data[0]
      // 更新查询次数
      await db.collection('barcode_cache')
        .doc(cached._id)
        .update({
          data: {
            queryCount: _.inc(1),
            lastQueryAt: Date.now()
          }
        })

      return {
        success: true,
        fromCache: true,
        data: cached.productInfo
      }
    }

    // 第二步：缓存没有，调用第三方 API
    const productInfo = await queryFromThirdParty(barcode)

    if (productInfo) {
      // 第三步：存入缓存
      await db.collection('barcode_cache').add({
        data: {
          barcode,
          productInfo,
          queryCount: 1,
          createdAt: Date.now(),
          lastQueryAt: Date.now()
        }
      })

      return {
        success: true,
        fromCache: false,
        data: productInfo
      }
    } else {
      return {
        success: false,
        message: '未找到该商品信息'
      }
    }
  } catch (err) {
    console.error('条码查询失败:', err)
    return {
      success: false,
      message: err.message || '查询失败'
    }
  }
}

// 调用第三方 API 查询条码
async function queryFromThirdParty(barcode) {
  // 探数数据 API（推荐）
  // 文档：https://www.tanshuapi.com/market/detail-77
  const API_KEY = process.env.BARCODE_API_KEY || ''
  
  if (!API_KEY) {
    console.warn('未配置条码 API Key，请在云函数环境变量中设置 BARCODE_API_KEY')
    return null
  }

  try {
    const url = `https://api.tanshuapi.com/api/barcode/v1/index?key=${API_KEY}&barcode=${barcode}`
    const response = await fetch(url)
    const result = await response.json()

    if (result.code === 1 && result.data) {
      // 格式化返回数据，统一字段名
      return {
        name: result.data.goods_name || '',
        brand: result.data.brand || result.data.trademark || '',
        category: result.data.category_name || '',
        spec: result.data.spec || '',
        image: result.data.image || '',
        shelfLife: result.data.shelf_life || '',
        manufacturer: result.data.company || result.data.manu_name || '',
        origin: result.data.origin_country || '',
        price: result.data.price || null,
        barcode: result.data.barcode || barcode,
        source: 'tanshuapi'
      }
    }

    console.warn('第三方 API 返回失败:', result)
    return null
  } catch (err) {
    console.error('调用第三方 API 失败:', err)
    return null
  }
}
