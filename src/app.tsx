import { Component, useEffect } from 'react'
import './app.scss'
import { itemStore } from './store/itemStore'

class App extends Component {
  async componentDidMount() {
    // 初始化数据
    await itemStore.init()
  }

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return this.props.children
  }
}

export default App
