import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/services/**/*.js'],
    }
  }
})
