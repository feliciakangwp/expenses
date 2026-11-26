import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const THRESHOLD = 80 // px to pull before triggering

export function PullToRefresh() {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      // Only activate when scrolled to the very top
      if (window.scrollY > 0) return
      startY.current = e.touches[0].clientY
      pulling.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) { setPullY(0); return }
      // Resist: feels natural, not 1:1
      setPullY(Math.min(dy * 0.4, THRESHOLD + 20))
    }

    const onTouchEnd = () => {
      if (!pulling.current) return
      pulling.current = false
      if (pullY >= THRESHOLD) {
        setRefreshing(true)
        setTimeout(() => window.location.reload(), 400)
      } else {
        setPullY(0)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [pullY])

  if (pullY === 0 && !refreshing) return null

  const progress = Math.min(pullY / THRESHOLD, 1)
  const triggered = pullY >= THRESHOLD || refreshing

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center transition-all"
      style={{ height: `${pullY + 4}px`, maxHeight: `${THRESHOLD + 24}px` }}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all ${
          triggered
            ? 'bg-primary-600 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'
        }`}
        style={{ opacity: Math.max(0.3, progress), transform: `scale(${0.6 + progress * 0.4})` }}
      >
        <RefreshCw
          size={16}
          className={refreshing ? 'animate-spin' : ''}
          style={{ transform: `rotate(${progress * 360}deg)` }}
        />
      </div>
    </div>
  )
}
