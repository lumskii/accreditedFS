import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error | null
}

class ChunkErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    // Nothing to do here beyond state - we handle reload logic in render
    console.error('ChunkErrorBoundary caught error:', error)
  }

  handleReload = () => {
    try {
      // Try clearing caches (if service worker present)
      if ('caches' in window) {
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
          .catch(e => console.warn('Failed to clear caches', e))
      }
    } catch (e) {
      console.warn('Cache clear error', e)
    }

    // Append a cache-busting query param to force reload of latest assets
    const url = new URL(window.location.href)
    url.searchParams.set('reload_ts', String(Date.now()))
    // Prevent infinite reload loops: store a flag in sessionStorage
    const key = '__app_reload_attempted'
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      window.location.replace(url.toString())
    } else {
      // Already tried reload, fallback to sending user to home so app isn't stuck
      window.location.replace('/')
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children as React.ReactElement

    const message = this.state.error?.message || 'An unexpected error occurred.'
    // Detect chunk load / dynamic import failure messages
    const isChunkLoadError = /Loading chunk|Failed to fetch dynamically imported module|Expected a JavaScript-or-Wasm module script|MIME type/.test(message)

    return (
      <div className="p-6">
        <div className="bg-white p-6 rounded shadow text-center">
          <h3 className="text-lg font-semibold mb-2">We're updating the app</h3>
          <p className="text-sm text-gray-600 mb-4">It looks like some frontend code failed to load. This can happen after a deployment.</p>
          <p className="text-xs text-gray-500 mb-4">Error: {message}</p>
          {isChunkLoadError ? (
            <button onClick={this.handleReload} className="px-4 py-2 bg-blue-600 text-white rounded">Reload latest version</button>
          ) : (
            <div>
              <button onClick={() => window.location.replace('/')} className="px-4 py-2 bg-gray-200 rounded">Go home</button>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default ChunkErrorBoundary
