import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface ItemCardProps {
  id: string
  name: string
  category: string
  expireDays?: number
  isExpiringSoon?: boolean
  images?: string[]
  onClick?: (id: string) => void
}

export default function ItemCard({ id, name, category, expireDays, isExpiringSoon, images, onClick }: ItemCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(id)
    } else {
      Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
    }
  }

  const hasImage = images && images.length > 0

  return (
    <View className='item-card' onClick={handleClick}>
      {hasImage ? (
        <Image className='item-card__thumb' src={images![0]} mode='aspectFill' />
      ) : (
        <View className='item-card__thumb item-card__thumb--placeholder'>
          <Text>📦</Text>
        </View>
      )}
      <View className='item-card__info'>
        <Text className='item-card__name'>{name}</Text>
        <Text className={`item-card__meta ${isExpiringSoon ? 'item-card__meta--warning' : ''}`}>
          {category}
          {expireDays !== undefined && expireDays >= 0
            ? ` · 还有 ${expireDays} 天`
            : ' · 无保质期'}
        </Text>
      </View>
      <Text className='item-card__arrow'>›</Text>
    </View>
  )
}
