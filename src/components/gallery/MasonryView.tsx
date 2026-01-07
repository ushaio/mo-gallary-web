'use client'

import { useMemo } from 'react'
import { PhotoDto, PublicSettingsDto, resolveAssetUrl } from '@/lib/api'
import MasonryPhotoAlbum, { RenderPhotoProps } from 'react-photo-album'

interface MasonryViewProps {
  photos: PhotoDto[]
  settings: PublicSettingsDto | null
  grayscale: boolean
  immersive?: boolean
  onPhotoClick: (photo: PhotoDto) => void
}

interface CustomPhoto {
  src: string
  width: number
  height: number
  key: string
  original?: PhotoDto
}

export function MasonryView({ photos, settings, grayscale, immersive = false, onPhotoClick }: MasonryViewProps) {
  const columns = useMemo(() => {
    if (typeof window === 'undefined') return 2
    if (window.innerWidth < 640) return 2
    if (window.innerWidth < 1024) return 3
    if (window.innerWidth < 1280) return 4
    return 5
  }, [])

  const photosForAlbum = useMemo<CustomPhoto[]>(() => {
    return photos.map((photo) => ({
      src: resolveAssetUrl(photo.thumbnailUrl || photo.url, settings?.cdn_domain),
      width: photo.width || 800,
      height: photo.height || 600,
      key: photo.id,
      original: photo,
    }))
  }, [photos, settings?.cdn_domain])

  return (
    <div className={immersive ? 'gap-1' : 'gap-4 sm:gap-6 lg:gap-8'}>
      <MasonryPhotoAlbum
        photos={photosForAlbum}
        columns={columns}
        layout="masonry"
        spacing={immersive ? 1 : 24}
        onClick={({ photo }) => {
          const original = photo.original as PhotoDto
          onPhotoClick(original)
        }}
      />
    </div>
  )
}
