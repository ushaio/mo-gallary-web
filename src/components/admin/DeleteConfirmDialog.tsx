'use client'

import { motion, AnimatePresence } from 'framer-motion'

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
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background border-2 border-border p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="font-serif text-2xl font-light uppercase tracking-tight mb-6">
              {t('common.confirm')}
            </h3>

            <div className="mb-8 space-y-4">
              <p className="text-sm text-foreground">
                {isBulk
                  ? `${t('admin.confirm_delete_multiple')} ${count} ${t(
                      'admin.photos'
                    )}?`
                  : `${t('admin.confirm_delete_single')}?`}
              </p>

              <div className="p-4 bg-muted/30 border border-border">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={deleteFromStorage}
                    onChange={(e) => setDeleteFromStorage(e.target.checked)}
                    className="w-5 h-5 mt-0.5 accent-primary cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                      {t('admin.delete_from_storage')}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono leading-relaxed">
                      {t('admin.delete_from_storage_hint')}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-3 border border-border text-foreground text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-6 py-3 bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
              >
                {t('common.delete')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
