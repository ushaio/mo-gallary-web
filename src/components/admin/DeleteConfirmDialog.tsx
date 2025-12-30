'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  isBulk: boolean
  count: number
  deleteFromStorage: boolean
  setDeleteFromStorage: (val: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  t: (key: string) => string
}

export function DeleteConfirmDialog({
  isOpen,
  isBulk,
  count,
  deleteFromStorage,
  setDeleteFromStorage,
  onConfirm,
  onCancel,
  t,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    if (isDeleting) return
    onCancel()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[121] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-background border border-border p-8 max-w-md w-full shadow-2xl pointer-events-auto"
            >
              {/* Header with Icon */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-light uppercase tracking-tight">
                    {t('common.confirm')}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                    {isBulk ? `${count} ${t('admin.photos')}` : '1 ' + t('admin.photos').replace(/s$/, '')}
                  </p>
                </div>
              </div>

              <div className="mb-6 space-y-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {isBulk
                    ? `${t('admin.confirm_delete_multiple')} ${count} ${t('admin.photos')}?`
                    : `${t('admin.confirm_delete_single')}?`}
                </p>

                <div className="p-4 bg-muted/30 border border-border">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={deleteFromStorage}
                        onChange={(e) => setDeleteFromStorage(e.target.checked)}
                        className="sr-only peer"
                        disabled={isDeleting}
                      />
                      <div className="w-5 h-5 border-2 border-border peer-checked:border-destructive peer-checked:bg-destructive transition-all flex items-center justify-center">
                        {deleteFromStorage && (
                          <svg className="w-3 h-3 text-destructive-foreground" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold uppercase tracking-wider text-foreground group-hover:text-destructive transition-colors">
                        {t('admin.delete_from_storage')}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                        {t('admin.delete_from_storage_hint')}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 border border-border text-foreground text-xs font-bold uppercase tracking-widest hover:bg-muted active:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-widest hover:bg-destructive/90 active:bg-destructive/80 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('common.delete')}...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>{t('common.delete')}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
