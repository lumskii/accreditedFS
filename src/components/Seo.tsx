import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Centralized SEO controller for SPA routes.
 * - Sets canonical URL dynamically per route
 * - Sets robots meta to noindex,nofollow on non-public/protected routes
 */
export default function Seo() {
  const location = useLocation()

  useEffect(() => {
    const { origin } = window.location
    const path = location.pathname
    const url = origin + path

    // Pages we do NOT want indexed
    const noIndexRegex = /^(\/(login|signup|payment-mode|verify|verify-email|agreement|agreement-view|checkout|success|cancel|dashboard|admin)(\/.*)?|\/admin(\/.*)?)$/i
    const isHome = path === '/'
    const shouldNoIndex = !isHome && noIndexRegex.test(path)

    // Update or create canonical tag
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    // Set canonical to exact path (no hash/query) to avoid homepage canonical on internal routes
    canonical.setAttribute('href', url)

    // Update robots meta
    let robots = document.querySelector("meta[name='robots']") as HTMLMetaElement | null
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', shouldNoIndex ? 'noindex,nofollow' : 'index,follow')

    return () => {
      // do nothing on unmount; next render will update
    }
  }, [location])

  return null
}
