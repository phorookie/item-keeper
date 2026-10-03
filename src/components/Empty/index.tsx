import { View, Text } from '@tarojs/components'
import './index.scss'

interface EmptyProps {
  icon?: string
  text: string
}

export default function Empty({ icon = '📦', text }: EmptyProps) {
  return (
    <View className='empty'>
      <Text className='empty__icon'>{icon}</Text>
      <Text className='empty__text'>{text}</Text>
    </View>
  )
}
