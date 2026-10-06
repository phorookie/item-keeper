import { useState } from 'react'
import { View, Text, ScrollView, Switch } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getStorage, setStorage } from '../../utils/storage'
import './index.scss'

export default function Reminder() {
  const [expireReminder, setExpireReminder] = useState(true)
  const [remindDays, setRemindDays] = useState(30)

  useDidShow(() => {
    loadSettings()
  })

  const loadSettings = async () => {
    const data = await getStorage()
    if (data.settings) {
      setExpireReminder(data.settings.expireReminder !== false)
      setRemindDays(data.settings.remindDays || 30)
    }
  }

  const saveSettings = async (updates: any) => {
    const data = await getStorage()
    const settings = {
      ...(data.settings || {}),
      ...updates,
    }
    await setStorage({ ...data, settings })
  }

  const handleExpireToggle = async (value: boolean) => {
    setExpireReminder(value)
    await saveSettings({ expireReminder: value })

    if (value) {
      // 请求订阅消息授权
      try {
        const res = await Taro.requestSubscribeMessage({
          tmplIds: ['your-template-id'], // 上线时替换为真实的模板 ID
        })
        console.log('订阅结果', res)
      } catch (err) {
        console.log('订阅失败', err)
      }
    }
  }

  const dayOptions = [7, 15, 30, 60, 90]

  const handleDaySelect = async (days: number) => {
    setRemindDays(days)
    await saveSettings({ remindDays: days })
  }

  return (
    <View className='reminder'>
      <ScrollView scrollY className='reminder__scroll'>
        <View className='reminder__section'>
          <Text className='reminder__section-title'>过期提醒</Text>

          <View className='reminder__card'>
            <View className='reminder__item'>
              <View className='reminder__item-left'>
                <Text className='reminder__item-icon'>⏰</Text>
                <View>
                  <Text className='reminder__item-name'>临期提醒</Text>
                  <Text className='reminder__item-desc'>物品即将过期时微信通知你</Text>
                </View>
              </View>
              <Switch
                checked={expireReminder}
                onChange={e => handleExpireToggle(e.detail.value)}
                color='#7A9E7E'
              />
            </View>
          </View>
        </View>

        {expireReminder && (
          <View className='reminder__section'>
            <Text className='reminder__section-title'>提前几天提醒</Text>
            <View className='reminder__card'>
              {dayOptions.map(days => (
                <View
                  key={days}
                  className={`reminder__day-item ${remindDays === days ? 'reminder__day-item--active' : ''}`}
                  onClick={() => handleDaySelect(days)}
                >
                  <Text className='reminder__day-text'>{days} 天</Text>
                  {remindDays === days && (
                    <Text className='reminder__day-check'>✓</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View className='reminder__tip'>
          <Text className='reminder__tip-icon'>💡</Text>
          <Text className='reminder__tip-text'>
            提醒功能需要你授权微信订阅消息。开启后，物品临期时会通过微信服务通知提醒你。
          </Text>
        </View>

        <View className='reminder__tip'>
          <Text className='reminder__tip-icon'>🔔</Text>
          <Text className='reminder__tip-text'>
            每次授权只能发送一次提醒，我们会在你打开小程序时自动续期。
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
