import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-primary-600 px-4 py-2.5 shadow-lg">
      <span className="text-sm font-medium text-white">A new version is available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
      >
        <RefreshCw size={13} />
        Refresh
      </button>
    </div>
  )
}
