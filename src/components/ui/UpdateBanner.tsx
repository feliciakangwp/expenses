import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

function getCurrentHash(): string | null {
  const scripts = document.querySelectorAll<HTMLScriptElement>('script[src*="/assets/index-"]')
  for (const s of scripts) {
    const m = s.src.match(/\/assets\/index-([A-Za-z0-9_-]+)\.js/)
    if (m) return m[1]
  }
  return null
}

async function fetchLatestHash(): Promise<string | null> {
  try {
    const res = await fetch(window.location.origin + '/expenses/', {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()
    const m = html.match(/\/assets\/index-([A-Za-z0-9_-]+)\.js/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

export function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false)

  useEffect(() => {
    const currentHash = getCurrentHash()
    if (!currentHash) return

    const check = async () => {
      const latestHash = await fetchLatestHash()
      if (latestHash && latestHash !== currentHash) setNeedRefresh(true)
    }

    // Check on mount, every 90s, and when app comes back to foreground
    check()
    const timer = setInterval(check, 90_000)
    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!needRefresh) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-primary-600 px-4 py-3 shadow-lg animate-slide-down">
      <span className="text-sm font-medium text-white">New version available</span>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 active:bg-white/40 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
      >
        <RefreshCw size={13} />
        Refresh
      </button>
    </div>
  )
}
