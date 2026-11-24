import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  action?: { label: string; onClick: () => void }
}

interface ToastContextValue {
  toast: (message: string, opts?: { type?: ToastItem['type']; action?: ToastItem['action'] }) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, opts?: { type?: ToastItem['type']; action?: ToastItem['action'] }) => {
      const id = crypto.randomUUID()
      const item: ToastItem = { id, message, type: opts?.type ?? 'success', action: opts?.action }
      setToasts((prev) => [...prev, item])
      if (!opts?.action) {
        setTimeout(() => dismiss(id), 3000)
      } else {
        setTimeout(() => dismiss(id), 6000)
      }
    },
    [dismiss]
  )

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />,
    error: <XCircle size={18} className="text-red-500 flex-shrink-0" />,
    info: <Info size={18} className="text-blue-500 flex-shrink-0" />,
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-gray-900 dark:bg-gray-100 px-4 py-3 shadow-xl max-w-sm w-full"
            >
              {icons[t.type]}
              <span className="text-sm font-medium text-white dark:text-gray-900 flex-1">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => { t.action!.onClick(); dismiss(t.id) }}
                  className="text-sm font-semibold text-primary-400 dark:text-primary-600 ml-1"
                >
                  {t.action.label}
                </button>
              )}
              <button onClick={() => dismiss(t.id)} className="text-gray-400 dark:text-gray-600">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
