// Vite 配置：React 插件 + 路径别名 @ -> src
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 拆分较大的第三方库，减小主包体积
        manualChunks: {
          gsap: ['gsap'],
          mdeditor: ['@uiw/react-md-editor'],
          html2canvas: ['html2canvas'],
        },
      },
    },
  },
});
