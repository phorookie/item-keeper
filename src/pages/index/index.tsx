import { useState, useEffect, useMemo } from 'react'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { itemStore } from '../../store/itemStore'
import ItemCard from '../../components/ItemCard'
import Empty from '../../components/Empty'
import { Item } from '../../types/item'
import './index.scss'

export default function Index() {
  const [searchText, setSearchText] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [items, setItems] = useState<Item[]>([])

  // 每次页面显示时刷新数据
  useDidShow(() => {
    loadData()
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const all = itemStore.getAll()
    setItems(all.sort((a, b) => b.createdAt - a.createdAt))
  }

  const expiringItems = useMemo(
    () => items.filter(i => i.isExpiringSoon),
    [items]
  )

  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return items
    const kw = searchText.toLowerCase()
    return items.filter(
      item =>
        item.name.toLowerCase().includes(kw) ||
        item.tags.some(t => t.toLowerCase().includes(kw)) ||
        item.category.toLowerCase().includes(kw) ||
        item.brand?.toLowerCase().includes(kw)
    )
  }, [items, searchText])

  const goToDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  const goToAdd = () => {
    Taro.navigateTo({ url: '/pages/add/index' })
  }

  return (
    <View className='home'>
      <View className='home__greeting'>
        <Text className='home__hello'>晚上好</Text>
        <Text className='home__title'>你的物品</Text>
      </View>

      {/* 搜索栏 */}
      <View className={`home__search ${isSearching ? 'home__search--focused' : ''}`}>
        <Text className='home__search-icon'>⌕</Text>
        <Input
          className='home__search-input'
          placeholder='搜索名称、功效、标签...'
          placeholderClass='home__search-placeholder'
          value={searchText}
          onInput={e => setSearchText(e.detail.value)}
          onFocus={() => setIsSearching(true)}
          onBlur={() => {
            if (!searchText) setIsSearching(false)
          }}
          confirmType='search'
        />
        {searchText && (
          <Text
            className='home__search-cancel'
            onClick={() => {
              setSearchText('')
              setIsSearching(false)
            }}
          >
            取消
          </Text>
        )}
      </View>

      <ScrollView scrollY className='home__content'>
        {/* 搜索结果 */}
        {searchText.trim() ? (
          <View className='home__search-results'>
            {filteredItems.length > 0 && (
              <View className='home__search-tip'>
                <Text className='home__search-tip-icon'>💡</Text>
                <Text className='home__search-tip-text'>
                  你已有 {filteredItems.length} 件「{searchText}」相关物品，别买重复啦
                </Text>
              </View>
            )}

            <View className='home__section-title'>
              <Text className='home__section-title-text'>搜索结果</Text>
              <Text className='home__section-title-count'>{filteredItems.length} 件</Text>
            </View>

            {filteredItems.length === 0 ? (
              <Empty icon='🔍' text='没有找到相关物品' />
            ) : (
              filteredItems.map(item => (
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
              ))
            )}
          </View>
        ) : (
          <>
            {/* 临期提醒 */}
            {expiringItems.length > 0 && (
              <View className='home__section'>
                <View className='home__section-title'>
                  <Text className='home__section-title-text'>即将过期</Text>
                  <Text className='home__section-title-count'>{expiringItems.length} 件</Text>
                </View>
                <View className='home__expiring-list'>
                  {expiringItems.map(item => (
                    <View
                      key={item.id}
                      className='expiring-item'
                      onClick={() => goToDetail(item.id)}
                    >
                      {item.images && item.images.length > 0 ? (
                        <Image className='expiring-item__thumb' src={item.images[0]} mode='aspectFill' />
                      ) : (
                        <View className='expiring-item__thumb expiring-item__thumb--placeholder'>
                          <Text>📦</Text>
                        </View>
                      )}
                      <View className='expiring-item__info'>
                        <Text className='expiring-item__name'>{item.name}</Text>
                        <Text className='expiring-item__time'>
                          还有 {item.expireDays} 天过期
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 全部物品 */}
            <View className='home__section'>
              <View className='home__section-title'>
                <Text className='home__section-title-text'>全部物品</Text>
                <Text className='home__section-title-count'>{items.length} 件</Text>
              </View>
              {items.length === 0 ? (
                <Empty icon='📦' text='还没有物品，点右下角添加吧' />
              ) : (
                items.map(item => (
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
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* 浮动添加按钮 */}
      <View className='home__fab' onClick={goToAdd}>
        <Text className='home__fab-icon'>+</Text>
      </View>
    </View>
  )
}
