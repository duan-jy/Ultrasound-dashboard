/**
 * Vite 配置文件
 * 配置 Vue 3 项目构建，支持 Win7 Chrome 109+ 兼容性
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // 目标浏览器：Chrome 109 (Win7 最后支持的版本)
    target: ['chrome109', 'edge109', 'firefox115', 'safari16'],
    // 禁用 ES2022 私有类字段语法，确保兼容性
    cssTarget: 'chrome109',
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'pinia', 'vue-router'],
        },
      },
    },
  },
  esbuild: {
    // 确保不使用私有类字段语法 (#field)
    target: 'chrome109',
  },
  server: {
    port: 3000,
    host: true,
  },
})
