import { defineConfig } from 'vite'

export default defineConfig(async () => {
  const pluginReact = (await import('@vitejs/plugin-react')).default
  return {
    plugins: [pluginReact()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'vendor.firebase'
              if (id.includes('jspdf')) return 'vendor.jspdf'
              if (id.includes('html2canvas')) return 'vendor.html2canvas'
              if (id.includes('dompurify')) return 'vendor.dompurify'
              if (id.includes('@emailjs')) return 'vendor.emailjs'
              if (id.includes('stripe')) return 'vendor.stripe'
              return 'vendor'
            }
          }
        }
      }
    }
  }
})
