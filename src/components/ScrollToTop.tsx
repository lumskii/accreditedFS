import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls the window to top whenever the pathname changes.
 * Does not interfere with in-page hash navigation since it only
 * reacts to pathname, not hash.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Use instant jump for policy pages; smooth is optional
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
