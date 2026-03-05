/**
 * 应用入口文件
 * 初始化 Vue 3 应用、Pinia 状态管理和全局样式
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
