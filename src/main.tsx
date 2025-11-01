import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

const container = document.getElementById('root')
// Global handler: catch dynamic import / chunk load failures and attempt a single cache-busting reload
window.addEventListener('unhandledrejection', (event) => {
  try {
    const reason = (event && (event as any).reason) || ''
    const msg = typeof reason === 'string' ? reason : (reason && reason.message) || ''
    if (/Loading chunk|Failed to fetch dynamically imported module|Expected a JavaScript-or-Wasm module script|MIME type/.test(msg)) {
      const key = '__app_reload_attempted'
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        // add cache bust param
        const url = new URL(window.location.href)
        url.searchParams.set('reload_ts', String(Date.now()))
        window.location.replace(url.toString())
      } else {
        console.warn('Chunk load failed and reload already attempted.');
      }
    }
  } catch (e) {
    console.warn('Error handling unhandledrejection', e)
  }
})
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
