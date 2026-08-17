import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView, trackSessionStart, flushAnalytics } from '../lib/analytics'

/**
 * Mount once near the app root. Tracks session start + page views on route change.
 * Works with HashRouter (uses hash path) and BrowserRouter.
 */
export default function AnalyticsProvider() {
  const location = useLocation()

  useEffect(() => {
    trackSessionStart()
  }, [])

  useEffect(() => {
    const path =
      location.pathname + (location.search || '') + (location.hash && !location.pathname ? location.hash : '')
    trackPageView(location.pathname || path || '/')
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    const onHide = () => flushAnalytics()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  }, [])

  return null
}
