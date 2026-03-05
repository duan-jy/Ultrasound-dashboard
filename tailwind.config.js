/**
 * Tailwind CSS 配置
 * 医疗超声智能体大屏主题配置
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 主色调 - 医疗蓝
        primary: {
          50: '#e6f4ff',
          100: '#b3dfff',
          200: '#80c9ff',
          300: '#4db3ff',
          400: '#1a9dff',
          500: '#0088e6',
          600: '#006bb3',
          700: '#004d80',
          800: '#00304d',
          900: '#00131a',
        },
        // 深色背景
        dark: {
          50: '#2a3441',
          100: '#232b36',
          200: '#1c232c',
          300: '#151b22',
          400: '#0e1318',
          500: '#070a0d',
          600: '#000000',
        },
        // 状态色
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 136, 230, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 136, 230, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
