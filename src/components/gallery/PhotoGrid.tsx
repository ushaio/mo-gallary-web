'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { PhotoDto, PublicSettingsDto } from '@/lib/api'
import { PhotoCard } from './PhotoCard'

interface PhotoGridProps {
  loading: boolean
  photos: PhotoDto[]
  settings: PublicSettingsDto | null
  onPhotoClick: (photo: PhotoDto) => void
  t: (key: string) => string
}

export function PhotoGrid({ loading, photos, settings, onPhotoClick, t }: PhotoGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto">
      <motion.div
        layout
        className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
      >
        <AnimatePresence mode="popLayout">
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              settings={settings}
              onClick={() => onPhotoClick(photo)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {photos.length === 0 && (
        <div className="py-40 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            {t('gallery.empty')}
          </p>
        </div>
      )}
    </div>
  )
}
