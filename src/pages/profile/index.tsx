import { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { itemStore, categories } from '../../store/itemStore'
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

export default function Profile() {
  const [stats, setStats] = useState<any>(null)

  useDidShow(() => {
    loadStats()
  })

  const loadStats = () => {
    const data = itemStore.getStats()
    setStats(data)
  }

  // 按花费排序的分类
  const sortedCategories = useMemo(() => {
    if (!stats?.byCategory) return []
    return Object.entries(stats.byCategory)
      .sort((a, b) => b[1].spent - a[1].spent)
  }, [stats])

  const maxSpent = useMemo(() => {
    if (sortedCategories.length === 0) return 0
    return sortedCategories[0][1].spent
  }, [sortedCategories])

  const handleReminderSetting = () => {
    Taro.navigateTo({ url: '/pages/reminder/index' })
  }

  const handleAbout = () => {
    Taro.showModal({
      title: '物品管家',
      content: '版本 1.0.0\n\n记录你的每一件物品，\n避免重复购买，不再浪费。',
      showCancel: false,
    })
  }

  const handleClearData = () => {
    Taro.showModal({
      title: '确认清空？',
      content: '所有物品数据将被删除，且无法恢复。',
      confirmColor: '#B85C4A',
      success: async res => {
        if (res.confirm) {
          Taro.clearStorageSync()
          Taro.showToast({ title: '已清空', icon: 'success' })
          setTimeout(() => {
            location.reload()
          }, 800)
        }
      },
    })
  }

  if (!stats) {
    return (
      <View className='profile profile--loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View className='profile'>
      <ScrollView scrollY className='profile__scroll'>
        {/* 顶部数据概览 */}
        <View className='profile__header'>
          <Text className='profile__title'>我的统计</Text>
          <View className='profile__stats-grid'>
            <View className='profile__stat-card'>
              <Text className='profile__stat-number'>{stats.total}</Text>
              <Text className='profile__stat-label'>物品总数</Text>
            </View>
            <View className='profile__stat-card'>
              <Text className='profile__stat-number'>{stats.categories}</Text>
              <Text className='profile__stat-label'>分类数</Text>
            </View>
            <View className='profile__stat-card'>
              <Text className='profile__stat-number profile__stat-number--warning'>
                {stats.expiring}
              </Text>
              <Text className='profile__stat-label'>即将过期</Text>
            </View>
            <View className='profile__stat-card'>
              <Text className='profile__stat-number profile__stat-number--muted'>
                {stats.used}
              </Text>
              <Text className='profile__stat-label'>已用完</Text>
            </View>
          </View>
        </View>

        {/* 花费统计 */}
        <View className='profile__section'>
          <Text className='profile__section-title'>花费统计</Text>
          <View className='profile__spent-card'>
            <View className='profile__spent-row'>
              <Text className='profile__spent-label'>累计花费</Text>
              <Text className='profile__spent-value'>¥ {stats.totalSpent.toFixed(0)}</Text>
            </View>
            <View className='profile__spent-row'>
              <Text className='profile__spent-label'>过期浪费</Text>
              <Text className='profile__spent-value profile__spent-value--danger'>
                ¥ {stats.wastedMoney.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>

        {/* 分类占比 */}
        {sortedCategories.length > 0 && (
          <View className='profile__section'>
            <Text className='profile__section-title'>分类占比</Text>
            <View className='profile__category-list'>
              {sortedCategories.map(([name, data]: [string, any]) => (
                <View key={name} className='profile__cat-row'>
                  <View className='profile__cat-left'>
                    <Text className='profile__cat-icon'>{categoryIcons[name] || '📦'}</Text>
                    <Text className='profile__cat-name'>{name}</Text>
                    <Text className='profile__cat-count'>{data.count} 件</Text>
                  </View>
                  <View className='profile__cat-right'>
                    <Text className='profile__cat-spent'>¥ {data.spent.toFixed(0)}</Text>
                  </View>
                </View>
              ))}
            </View>
            {/* 条形图 */}
            <View className='profile__chart'>
              {sortedCategories.map(([name, data]: [string, any]) => (
                <View key={name} className='profile__chart-bar'>
                  <Text className='profile__chart-label'>{categoryIcons[name] || '📦'}</Text>
                  <View className='profile__chart-track'>
                    <View
                      className='profile__chart-fill'
                      style={{ width: `${maxSpent > 0 ? (data.spent / maxSpent) * 100 : 0}%` }}
                    />
                  </View>
                  <Text className='profile__chart-value'>¥{data.spent.toFixed(0)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 设置列表 */}
        <View className='profile__section'>
          <Text className='profile__section-title'>设置</Text>
          <View className='profile__settings'>
            <View className='profile__setting-item' onClick={handleReminderSetting}>
              <Text className='profile__setting-icon'>🔔</Text>
              <Text className='profile__setting-name'>提醒设置</Text>
              <Text className='profile__setting-arrow'>›</Text>
            </View>
            <View className='profile__setting-item' onClick={handleAbout}>
              <Text className='profile__setting-icon'>ℹ️</Text>
              <Text className='profile__setting-name'>关于</Text>
              <Text className='profile__setting-arrow'>›</Text>
            </View>
            <View className='profile__setting-item' onClick={handleClearData}>
              <Text className='profile__setting-icon'>🗑</Text>
              <Text className='profile__setting-name profile__setting-name--danger'>清空数据</Text>
              <Text className='profile__setting-arrow'>›</Text>
            </View>
          </View>
        </View>

        <View className='profile__footer'>
          <Text className='profile__footer-text'>物品管家 · 记录每一件好物</Text>
        </View>
      </ScrollView>
    </View>
  )
}
