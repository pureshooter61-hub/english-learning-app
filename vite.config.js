import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/english-learning-app/', // GitHubリポジトリ名に合わせて変更
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  }
})
