import { defineConfig } from 'vite'

export default defineConfig(async () => {
  const pluginReact = (await import('@vitejs/plugin-react')).default
  return {
    plugins: [pluginReact()],
  }
})
