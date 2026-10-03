import { View, Text } from '@tarojs/components'
import './index.scss'

interface TagProps {
  text: string
  onRemove?: () => void
}

export default function Tag({ text, onRemove }: TagProps) {
  return (
    <View className='tag' onClick={onRemove}>
      <Text>{text}</Text>
      {onRemove && <Text className='tag__close'> ×</Text>}
    </View>
  )
}
