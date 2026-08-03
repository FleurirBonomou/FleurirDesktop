import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src')
    }
  },
  test: {
    environment: 'jsdom',
    // globals activés pour que @testing-library/react nettoie le DOM
    // automatiquement entre chaque test (afterEach global).
    globals: true,
    include: ['src/renderer/src/**/*.test.{ts,tsx}']
  }
})
