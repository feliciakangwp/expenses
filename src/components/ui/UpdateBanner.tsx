import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      const check = async () => {
        if (!registration?.installing && navigator.onLine) {
          const res = await fetch(swUrl, { cache: 'no-store' })
          if (res?.status === 200) await registration?.update()
        }
      }
      // Check immediately, then every 30 s, and whenever the app is foregrounded.
      check()
      setInterval(check, 30_000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  // Auto-apply after 15 s if the user hasn't tapped Refresh —
  // catches browsers (Safari) where the banner may not be tapped.
  useEffect(() => {
    if (!needRefresh) return
    const t = setTimeout(() => updateServiceWorker(true), 15_000)
    return () => clearTimeout(t)
  }, [needRefresh, updateServiceWorker])

  if (!needRefresh) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-primary-600 shadow-lg animate-slide-down"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm font-medium text-white">New version available</span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 active:bg-white/40 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>
    </div>
  )
}
