'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { PhotoDto, PublicSettingsDto } from '@/lib/api'
import { PhotoCard } from './PhotoCard'

interface MasonryViewProps {
  photos: PhotoDto[]
  settings: PublicSettingsDto | null
  grayscale: boolean
  immersive?: boolean
  onPhotoClick: (photo: PhotoDto) => void
}

export function MasonryView({ photos, settings, grayscale, immersive = false, onPhotoClick }: MasonryViewProps) {
  return (
    <motion.div
      layout
      className={`columns-2 sm:columns-3 lg:columns-4 xl:columns-5 ${immersive ? 'gap-1' : 'gap-4 sm:gap-6 lg:gap-8'}`}
    >
      <AnimatePresence mode="popLayout">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={index}
            settings={settings}
            grayscale={grayscale}
            immersive={immersive}
            onClick={() => onPhotoClick(photo)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
