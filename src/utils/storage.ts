// 本地存储封装
import Taro from '@tarojs/taro'

const STORAGE_KEY = 'item_keeper_data'

export interface StorageData {
  items: any[]
  version: number
}

export async function getStorage(): Promise<StorageData> {
  try {
    const res = await Taro.getStorage({ key: STORAGE_KEY })
    return res.data || { items: [], version: 1 }
  } catch {
    return { items: [], version: 1 }
  }
}

export async function setStorage(data: StorageData): Promise<void> {
  try {
    await Taro.setStorage({ key: STORAGE_KEY, data })
  } catch (err) {
    console.error('Storage save failed:', err)
  }
}

export async function clearStorage(): Promise<void> {
  try {
    await Taro.removeStorage({ key: STORAGE_KEY })
  } catch (err) {
    console.error('Storage clear failed:', err)
  }
}
