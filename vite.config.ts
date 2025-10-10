import { defineConfig } from 'vite'

export default defineConfig(async () => {
  const pluginReact = (await import('@vitejs/plugin-react')).default
  return {
    // During dev, proxy /api requests to the backend (deployed or local)
    server: {
      proxy: {
        // forward any /api requests to the target backend to avoid CORS/404 during dev
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || 'https://accreditedfs.vercel.app',
          changeOrigin: true,
          secure: true,
          // keep path as-is
          rewrite: (path: string) => path,
        },
      },
    },
    plugins: [pluginReact()],
    build: {
      // Enable source maps for better debugging but keep them separate
      sourcemap: false,
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
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
              if (id.includes('react') || id.includes('react-dom')) return 'vendor.react'
              if (id.includes('lucide-react')) return 'vendor.icons'
              return 'vendor'
            }
          }
        }
      },
      // Enable minification
      minify: 'terser' as const,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    },
  }
})
