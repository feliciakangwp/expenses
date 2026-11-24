import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  fullHeight?: boolean
}

export function Sheet({ open, onClose, title, children, className, fullHeight }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl safe-area-inset-bottom',
              fullHeight ? 'h-[95vh]' : 'max-h-[95vh]',
              className
            )}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="mx-auto h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700 absolute top-3 left-1/2 -translate-x-1/2" />
              {title && (
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">{title}</h2>
              )}
              <button
                onClick={onClose}
                className="ml-auto rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-56px)]">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
