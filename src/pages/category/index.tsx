import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { itemStore, categories } from '../../store/itemStore'
import ItemCard from '../../components/ItemCard'
import Empty from '../../components/Empty'
import { Item } from '../../types/item'
import './index.scss'

// 分类图标
const categoryIcons: Record<string, string> = {
  '护肤品': '🧴',
  '保健品': '💊',
  '食品': '🍎',
  '日用品': '🧺',
  '衣物鞋包': '👕',
  '数码家电': '📱',
  '其他': '📦',
}

export default function Category() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({})

  useDidShow(() => {
    loadData()
  })

  useEffect(() => {
    loadData()
    // 从首页跳转过来时，自动选中对应分类
    if (router.params.cat) {
      setActiveCategory(decodeURIComponent(router.params.cat))
    }
  }, [])

  const loadData = () => {
    const all = itemStore.getAll()
    setItems(all)

    // 统计每个分类的数量
    const stats: Record<string, number> = {}
    all.forEach(item => {
      stats[item.category] = (stats[item.category] || 0) + 1
    })
    setCategoryStats(stats)
  }

  const filteredItems = activeCategory
    ? items.filter(i => i.category === activeCategory)
    : items

  const goToDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  const total = items.length

  return (
    <View className='category-page'>
      {/* 顶部分类横滑 */}
      <ScrollView scrollX className='category-page__tabs' showScrollbar={false}>
        <View
          className={`category-page__tab ${!activeCategory ? 'category-page__tab--active' : ''}`}
          onClick={() => setActiveCategory('')}
        >
          <Text className='category-page__tab-icon'>📋</Text>
          <Text className='category-page__tab-name'>全部</Text>
          <Text className='category-page__tab-count'>{total}</Text>
        </View>
        {categories.map(cat => (
          <View
            key={cat.name}
            className={`category-page__tab ${activeCategory === cat.name ? 'category-page__tab--active' : ''}`}
            onClick={() => setActiveCategory(cat.name)}
          >
            <Text className='category-page__tab-icon'>{categoryIcons[cat.name] || '📦'}</Text>
            <Text className='category-page__tab-name'>{cat.name}</Text>
            <Text className='category-page__tab-count'>{categoryStats[cat.name] || 0}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 物品列表 */}
      <ScrollView scrollY className='category-page__list'>
        {filteredItems.length === 0 ? (
          <Empty icon='📦' text={activeCategory ? '该分类还没有物品' : '还没有物品'} />
        ) : (
          <View className='category-page__items'>
            <View className='category-page__items-title'>
              <Text>{activeCategory || '全部物品'}</Text>
              <Text className='category-page__items-count'>{filteredItems.length} 件</Text>
            </View>
            {filteredItems.map(item => (
              <ItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                category={item.category}
                expireDays={item.expireDays}
                isExpiringSoon={item.isExpiringSoon}
                images={item.images}
                onClick={goToDetail}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
