import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Image, Swiper, SwiperItem } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { itemStore } from '../../store/itemStore'
import Tag from '../../components/Tag'
import { Item } from '../../types/item'
import './index.scss'

export default function Detail() {
  const router = useRouter()
  const [item, setItem] = useState<Item | null>(null)

  useEffect(() => {
    const id = router.params.id
    if (id) {
      const found = itemStore.getById(id)
      if (found) {
        setItem(found)
        Taro.setNavigationBarTitle({ title: found.name })
      }
    }
  }, [router.params.id])

  const goEdit = () => {
    if (item) {
      Taro.navigateTo({ url: `/pages/add/index?id=${item.id}` })
    }
  }

  const markUsed = async () => {
    if (!item) return

    const res = await Taro.showModal({
      title: '确认用完了吗？',
      content: '标记后物品将移至历史记录',
      confirmText: '标记用完',
      confirmColor: '#B85C4A',
    })

    if (res.confirm) {
      await itemStore.markUsed(item.id)
      Taro.showToast({ title: '已标记', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 800)
    }
  }

  const handlePreviewImage = (index: number) => {
    if (!item || !item.images.length) return
    Taro.previewImage({
      current: item.images[index],
      urls: item.images,
    })
  }

  if (!item) {
    return (
      <View className='detail detail--loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  // 状态文字
  let statusText = ''
  if (item.expireDays !== undefined && item.expireDays >= 0) {
    statusText = `保质期还有 ${item.expireDays} 天`
    if (item.openExpireDays) {
      statusText += ` · 开封后剩余 ${item.openExpireDays} 天`
    }
  } else {
    statusText = '无保质期限制'
  }

  const hasImages = item.images && item.images.length > 0

  return (
    <View className='detail'>
      <ScrollView scrollY className='detail__scroll'>
        {/* Hero 图片区域 */}
        <View className='detail__hero'>
          {hasImages ? (
            <Swiper
              className='detail__hero-swiper'
              indicatorDots={item.images!.length > 1}
              indicatorColor='rgba(0,0,0,0.2)'
              indicatorActiveColor='#7A9E7E'
              circular
            >
              {item.images!.map((img, idx) => (
                <SwiperItem key={idx} onClick={() => handlePreviewImage(idx)}>
                  <Image className='detail__hero-img' src={img} mode='aspectFill' />
                </SwiperItem>
              ))}
            </Swiper>
          ) : (
            <View className='detail__hero-placeholder'>
              <Text className='detail__hero-icon'>📦</Text>
            </View>
          )}
        </View>

        {/* 内容区 */}
        <View className='detail__body'>
          <Text className='detail__title'>{item.name}</Text>
          <Text className='detail__category'>{item.category} › {item.subCategory}</Text>

          {/* 状态卡片 */}
          {item.expireDays !== undefined && item.expireDays >= 0 && (
            <View className={`detail__status ${item.isExpiringSoon ? 'detail__status--soon' : ''}`}>
              <Text className='detail__status-icon'>⏱</Text>
              <Text className='detail__status-text'>{statusText}</Text>
            </View>
          )}

          {/* 标签 */}
          {item.tags.length > 0 && (
            <View className='detail__section'>
              <Text className='detail__section-title'>功效标签</Text>
              <View className='detail__tags'>
                {item.tags.map(tag => (
                  <Tag key={tag} text={tag} />
                ))}
              </View>
            </View>
          )}

          {/* 基本信息 */}
          <View className='detail__section'>
            <Text className='detail__section-title'>基本信息</Text>
            <View className='detail__info-list'>
              {item.brand && (
                <View className='detail__info-row'>
                  <Text className='detail__info-label'>品牌</Text>
                  <Text className='detail__info-value'>{item.brand}</Text>
                </View>
              )}
              {item.price !== undefined && item.price !== null && (
                <View className='detail__info-row'>
                  <Text className='detail__info-label'>价格</Text>
                  <Text className='detail__info-value'>¥ {item.price}</Text>
                </View>
              )}
              <View className='detail__info-row'>
                <Text className='detail__info-label'>购买日期</Text>
                <Text className='detail__info-value'>{item.purchaseDate || '—'}</Text>
              </View>
              {item.produceDate && (
                <View className='detail__info-row'>
                  <Text className='detail__info-label'>生产日期</Text>
                  <Text className='detail__info-value'>{item.produceDate}</Text>
                </View>
              )}
              {item.shelfLife && (
                <View className='detail__info-row'>
                  <Text className='detail__info-label'>保质期</Text>
                  <Text className='detail__info-value'>{item.shelfLife}</Text>
                </View>
              )}
              {item.expireDate && (
                <View className='detail__info-row'>
                  <Text className='detail__info-label'>到期日</Text>
                  <Text className={`detail__info-value ${item.isExpiringSoon ? 'detail__info-value--warning' : ''}`}>
                    {item.expireDate}
                  </Text>
                </View>
              )}
              {item.openDate && (
                <View className='detail__info-row'>
                  <Text className='detail__info-label'>开封日期</Text>
                  <Text className='detail__info-value'>{item.openDate}</Text>
                </View>
              )}
            </View>
          </View>

          {/* 备注 */}
          {item.note && (
            <View className='detail__section'>
              <Text className='detail__section-title'>备注</Text>
              <Text className='detail__note'>{item.note}</Text>
            </View>
          )}

          {/* 操作按钮 */}
          <View className='detail__actions'>
            <View className='detail__btn detail__btn--ghost' onClick={markUsed}>
              <Text>标记用完</Text>
            </View>
            <View className='detail__btn detail__btn--primary' onClick={goEdit}>
              <Text>编辑</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
