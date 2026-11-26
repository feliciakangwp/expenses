import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const THRESHOLD = 70

export function PullToRefresh() {
  const startYRef = useRef(0)
  const pullYRef = useRef(0)
  const isPullingRef = useRef(false)
  const [displayY, setDisplayY] = useState(0)
  const [triggered, setTriggered] = useState(false)

  useEffect(() => {
    const isAtTop = () => {
      const st = window.scrollY ?? document.documentElement.scrollTop ?? document.body.scrollTop
      return st <= 2
    }

    const onStart = (e: TouchEvent) => {
      if (!isAtTop()) return
      startYRef.current = e.touches[0].clientY
      isPullingRef.current = true
      pullYRef.current = 0
    }

    const onMove = (e: TouchEvent) => {
      if (!isPullingRef.current) return
      if (!isAtTop()) { isPullingRef.current = false; setDisplayY(0); return }
      const dy = e.touches[0].clientY - startYRef.current
      if (dy <= 0) { setDisplayY(0); return }
      pullYRef.current = Math.min(dy * 0.42, THRESHOLD + 18)
      setDisplayY(pullYRef.current)
    }

    const onEnd = () => {
      if (!isPullingRef.current) return
      isPullingRef.current = false
      if (pullYRef.current >= THRESHOLD) {
        setTriggered(true)
        setTimeout(() => window.location.reload(), 500)
      } else {
        pullYRef.current = 0
        setDisplayY(0)
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, []) // empty deps — all mutable state is in refs

  if (displayY === 0 && !triggered) return null

  const progress = Math.min(displayY / THRESHOLD, 1)
  const done = displayY >= THRESHOLD || triggered

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center pointer-events-none"
      style={{ height: `${displayY + 4}px` }}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full shadow-md ${
          done ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'
        }`}
        style={{ opacity: Math.max(0.2, progress), transform: `scale(${0.5 + progress * 0.5})` }}
      >
        <RefreshCw
          size={16}
          className={triggered ? 'animate-spin' : ''}
          style={!triggered ? { transform: `rotate(${progress * 270}deg)` } : undefined}
        />
      </div>
    </div>
  )
}
