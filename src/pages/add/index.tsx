import { useState, useEffect, useMemo } from 'react'
import { View, Text, Input, Picker, Textarea, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { itemStore, categories, presetTags } from '../../store/itemStore'
import Tag from '../../components/Tag'
import { today, shelfLifeOptions, parseShelfLife } from '../../utils/date'
import { Item } from '../../types/item'
import { scanAndQuery, matchShelfLifeIndex } from '../../utils/barcode'
import './index.scss'

export default function Add() {
  const router = useRouter()
  const editId = router.params.id
  const isEdit = !!editId
  const scanParams = router.params

  const [name, setName] = useState('')
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [images, setImages] = useState<string[]>([])
  // 效期
  const [produceDate, setProduceDate] = useState('')
  const [shelfLifeIndex, setShelfLifeIndex] = useState(2) // 默认2年
  const [hasExpire, setHasExpire] = useState(true) // 是否有保质期
  // 开封
  const [openDate, setOpenDate] = useState('')
  // 标签
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  // 条码
  const [barcode, setBarcode] = useState('')
  const [fromScan, setFromScan] = useState(false)

  // 自动计算的到期日
  const calculatedExpire = useMemo(() => {
    if (!produceDate || !hasExpire) return ''
    const months = shelfLifeOptions[shelfLifeIndex]?.months || 24
    const date = new Date(produceDate)
    date.setMonth(date.getMonth() + months)
    date.setDate(date.getDate() - 1)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [produceDate, shelfLifeIndex, hasExpire])

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: isEdit ? '编辑物品' : '添加物品' })

    if (isEdit && editId) {
      const item = itemStore.getById(editId)
      if (item) {
        setName(item.name)
        setBrand(item.brand || '')
        setPrice(item.price ? String(item.price) : '')
        setImages(item.images || [])
        setProduceDate(item.produceDate || '')
        setHasExpire(!!item.expireDate)
        setOpenDate(item.openDate || '')
        setTags([...item.tags])
        setNote(item.note || '')

        const catIdx = categories.findIndex(c => c.name === item.category)
        if (catIdx >= 0) setCategoryIndex(catIdx)

        const slIdx = shelfLifeOptions.findIndex(s => s.label === item.shelfLife)
        if (slIdx >= 0) setShelfLifeIndex(slIdx)
      }
    } else if (scanParams.barcode) {
      // 从扫码跳转过来，自动填充
      setFromScan(true)
      setBarcode(scanParams.barcode)

      if (scanParams.name) {
        setName(scanParams.name)
      }
      if (scanParams.brand) {
        setBrand(scanParams.brand)
      }
      if (scanParams.image) {
        setImages([scanParams.image])
      }
      if (scanParams.price) {
        setPrice(scanParams.price)
      }

      // 智能匹配保质期
      const slMonths = Number(scanParams.shelfLifeMonths) || 0
      if (slMonths > 0) {
        const slIdx = matchShelfLifeIndex(slMonths)
        if (slIdx >= 0) setShelfLifeIndex(slIdx)
      }

      // 智能匹配分类（已经匹配好的标准分类）
      if (scanParams.category) {
        const catIdx = categories.findIndex(c => c.name === scanParams.category)
        if (catIdx >= 0) setCategoryIndex(catIdx)
      }

      // 自动添加推荐标签
      if (scanParams.tags) {
        const tagList = scanParams.tags.split(',').filter(Boolean)
        if (tagList.length > 0) {
          setTags(tagList)
        }
      }
    }
  }, [editId, isEdit, scanParams])

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleAddCustomTag = () => {
    Taro.showModal({
      title: '添加标签',
      editable: true,
      placeholderText: '输入标签名称',
      success: res => {
        if (res.confirm && res.content?.trim()) {
          addTag(res.content.trim())
        }
      },
    })
  }

  const handleScan = async () => {
    Taro.showLoading({ title: '扫描中...' })
    const { barcode: newBarcode, product } = await scanAndQuery()
    Taro.hideLoading()

    if (!newBarcode) return

    setBarcode(newBarcode)
    setFromScan(true)

    if (product) {
      // 自动填充信息
      if (product.name) setName(product.name)
      if (product.brand) setBrand(product.brand)
      if (product.price) setPrice(String(product.price))
      if (product.image) setImages(prev => prev.length < 3 ? [product.image, ...prev].slice(0, 3) : prev)

      // 智能匹配保质期（按月数找最接近的选项）
      if (product.shelfLifeMonths && product.shelfLifeMonths > 0) {
        const slIdx = matchShelfLifeIndex(product.shelfLifeMonths)
        if (slIdx >= 0) setShelfLifeIndex(slIdx)
      }

      // 智能匹配分类（barcode.ts 里已经匹配好了，直接用）
      if (product.category) {
        const catIdx = categories.findIndex(c => c.name === product.category)
        if (catIdx >= 0) setCategoryIndex(catIdx)
      }

      // 自动添加推荐标签
      if (product.tags && product.tags.length > 0) {
        setTags(prev => {
          const newTags = [...prev]
          product.tags.forEach(tag => {
            if (!newTags.includes(tag)) newTags.push(tag)
          })
          return newTags
        })
      }

      Taro.showToast({ title: '已自动填充', icon: 'success' })
    } else {
      Taro.showToast({ title: '未找到商品信息', icon: 'none' })
    }
  }

  const handleChooseImage = () => {
    const remain = 3 - images.length
    if (remain <= 0) {
      Taro.showToast({ title: '最多3张照片', icon: 'none' })
      return
    }
    Taro.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const newImages = res.tempFilePaths.slice(0, remain)
        setImages([...images, ...newImages])
      },
    })
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  const handlePreviewImage = (index: number) => {
    Taro.previewImage({
      current: images[index],
      urls: images,
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入物品名称', icon: 'none' })
      return
    }

    const category = categories[categoryIndex]
    const itemData: Partial<Item> = {
      name: name.trim(),
      category: category.name,
      subCategory: category.subCategories[0] || '未分类',
      brand: brand.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
      purchaseDate: today(),
      images: [...images],
      tags: [...tags],
      note: note.trim() || undefined,
    }

    if (hasExpire && produceDate) {
      itemData.produceDate = produceDate
      itemData.shelfLife = shelfLifeOptions[shelfLifeIndex]?.label
      itemData.expireDate = calculatedExpire
    }

    if (openDate) {
      itemData.openDate = openDate
    }

    if (isEdit && editId) {
      await itemStore.update(editId, itemData)
      Taro.showToast({ title: '已保存', icon: 'success' })
    } else {
      await itemStore.add(itemData as any)
      Taro.showToast({ title: '添加成功', icon: 'success' })
    }

    setTimeout(() => Taro.navigateBack(), 800)
  }

  const suggestTags = presetTags.filter(t => !tags.includes(t)).slice(0, 6)

  return (
    <View className='add'>
      <ScrollView scrollY className='add__scroll'>
        {/* 照片上传区 */}
        <View className='add__photo-section'>
          <View className='add__photo-list'>
            {images.map((img, idx) => (
              <View key={idx} className='add__photo-item'>
                <Image
                  className='add__photo-img'
                  src={img}
                  mode='aspectFill'
                  onClick={() => handlePreviewImage(idx)}
                />
                <View className='add__photo-remove' onClick={() => handleRemoveImage(idx)}>
                  <Text>×</Text>
                </View>
              </View>
            ))}
            {images.length < 3 && (
              <View className='add__photo-add' onClick={handleChooseImage}>
                <Text className='add__photo-add-icon'>+</Text>
                <Text className='add__photo-add-text'>{images.length}/3</Text>
              </View>
            )}
          </View>
        </View>

        {/* 物品信息 */}
        <View className='add__group'>
          <Text className='add__group-title'>物品信息</Text>

          <View className='add__field'>
            <Text className='add__field-label'>名称</Text>
            <View className='add__field-input-wrap'>
              <Input
                className='add__field-input'
                placeholder='请输入物品名称'
                placeholderClass='add__field-placeholder'
                value={name}
                onInput={e => setName(e.detail.value)}
              />
              <View className='add__field-scan' onClick={handleScan}>
                <Text className='add__field-scan-icon'>⌖</Text>
                <Text className='add__field-scan-text'>扫码</Text>
              </View>
            </View>
          </View>

          <Picker
            mode='selector'
            range={categories.map(c => c.name)}
            value={categoryIndex}
            onChange={e => setCategoryIndex(Number(e.detail.value))}
          >
            <View className='add__field'>
              <Text className='add__field-label'>分类</Text>
              <View className='add__field-value-wrap'>
                <Text className='add__field-value'>{categories[categoryIndex].name}</Text>
                <Text className='add__field-arrow'>›</Text>
              </View>
            </View>
          </Picker>

          <View className='add__field'>
            <Text className='add__field-label'>品牌</Text>
            <Input
              className='add__field-input'
              placeholder='选填'
              placeholderClass='add__field-placeholder'
              value={brand}
              onInput={e => setBrand(e.detail.value)}
            />
          </View>
        </View>

        {/* 效期信息 */}
        <View className='add__group'>
          <View className='add__group-header'>
            <Text className='add__group-title'>效期</Text>
            <View className='add__switch' onClick={() => setHasExpire(!hasExpire)}>
              <View className={`add__switch-btn ${hasExpire ? 'add__switch-btn--on' : ''}`} />
            </View>
          </View>

          {hasExpire ? (
            <>
              <Picker
                mode='date'
                value={produceDate}
                onChange={e => setProduceDate(e.detail.value)}
              >
                <View className='add__field'>
                  <Text className='add__field-label'>生产日期</Text>
                  <View className='add__field-value-wrap'>
                    <Text className={`add__field-value ${!produceDate ? 'add__field-value--muted' : ''}`}>
                      {produceDate || '请选择日期'}
                    </Text>
                    <Text className='add__field-arrow'>›</Text>
                  </View>
                </View>
              </Picker>

              <Picker
                mode='selector'
                range={shelfLifeOptions.map(s => s.label)}
                value={shelfLifeIndex}
                onChange={e => setShelfLifeIndex(Number(e.detail.value))}
              >
                <View className='add__field'>
                  <Text className='add__field-label'>保质期</Text>
                  <View className='add__field-value-wrap'>
                    <Text className='add__field-value'>{shelfLifeOptions[shelfLifeIndex]?.label}</Text>
                    <Text className='add__field-arrow'>›</Text>
                  </View>
                </View>
              </Picker>

              {produceDate && (
                <View className='add__field add__field--readonly'>
                  <Text className='add__field-label'>到期日</Text>
                  <Text className='add__field-value add__field-value--calc'>{calculatedExpire}</Text>
                </View>
              )}
            </>
          ) : (
            <View className='add__field add__field--readonly'>
              <Text className='add__field-label'>无保质期</Text>
            </View>
          )}

          <Picker
            mode='date'
            value={openDate}
            onChange={e => setOpenDate(e.detail.value)}
          >
            <View className='add__field'>
              <Text className='add__field-label'>开封日期</Text>
              <View className='add__field-value-wrap'>
                <Text className={`add__field-value ${!openDate ? 'add__field-value--muted' : ''}`}>
                  {openDate || '未开封'}
                </Text>
                <Text className='add__field-arrow'>›</Text>
              </View>
            </View>
          </Picker>

          <View className='add__field'>
            <Text className='add__field-label'>价格</Text>
            <Input
              className='add__field-input'
              type='digit'
              placeholder='选填'
              placeholderClass='add__field-placeholder'
              value={price}
              onInput={e => setPrice(e.detail.value)}
            />
          </View>
        </View>

        {/* 功效标签 */}
        <View className='add__group'>
          <Text className='add__group-title'>功效标签</Text>
          <View className='add__tag-area'>
            {tags.map(tag => (
              <Tag key={tag} text={tag} onRemove={() => removeTag(tag)} />
            ))}
            <View className='add__tag-add' onClick={handleAddCustomTag}>
              <Text>+ 添加</Text>
            </View>
          </View>

          {suggestTags.length > 0 && (
            <View className='add__tag-suggest'>
              <Text className='add__tag-suggest-label'>推荐标签</Text>
              <View className='add__tag-suggest-list'>
                {suggestTags.map(tag => (
                  <View
                    key={tag}
                    className='add__tag-suggest-item'
                    onClick={() => addTag(tag)}
                  >
                    <Text>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 备注 */}
        <View className='add__group'>
          <Text className='add__group-title'>备注</Text>
          <Textarea
            className='add__note'
            placeholder='记录使用感受、购买渠道等...'
            placeholderClass='add__field-placeholder'
            value={note}
            onInput={e => setNote(e.detail.value)}
            maxlength={500}
          />
        </View>
      </ScrollView>

      {/* 底部保存按钮 */}
      <View className='add__save-bar'>
        <View className='add__save-btn' onClick={handleSave}>
          <Text>保存</Text>
        </View>
      </View>
    </View>
  )
}
