'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, MapPin, Maximize2, Star } from 'lucide-react'
import { PhotoDto, resolveAssetUrl, PublicSettingsDto } from '@/lib/api'
import { formatFileSize } from '@/lib/utils'

interface AdminPreviewModalProps {
  photo: PhotoDto | null
  isOpen: boolean
  onClose: () => void
  t: (key: string) => string
  settings: PublicSettingsDto | null
}

export function AdminPreviewModal({
  photo,
  isOpen,
  onClose,
  t,
  settings,
}: AdminPreviewModalProps) {
  const [dominantColors, setDominantColors] = useState<string[]>([])
  const resolvedCdnDomain = settings?.cdn_domain?.trim() || undefined

  useEffect(() => {
    if (photo && isOpen) {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.src = resolveAssetUrl(photo.url, resolvedCdnDomain)
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (!ctx) return
          canvas.width = 40
          canvas.height = 40
          ctx.drawImage(img, 0, 0, 40, 40)
          const imageData = ctx.getImageData(0, 0, 40, 40).data
          const colorCounts: Record<string, number> = {}
          for (let i = 0; i < imageData.length; i += 16) {
            const r = Math.round(imageData[i] / 10) * 10
            const g = Math.round(imageData[i + 1] / 10) * 10
            const b = Math.round(imageData[i + 2] / 10) * 10
            const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b)
              .toString(16)
              .slice(1)}`
            colorCounts[hex] = (colorCounts[hex] || 0) + 1
          }
          const sorted = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map((c) => c[0])
          setDominantColors(sorted)
        } catch (e) {
          console.error('Palette extraction failed', e)
        }
      }
    } else {
      setDominantColors([])
    }
  }, [photo, isOpen, resolvedCdnDomain])

  return (
    <AnimatePresence>
      {photo && isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8 bg-background/95 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="relative w-full h-full max-w-[1800px] bg-background border border-border flex flex-col lg:flex-row overflow-hidden shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-0 right-0 z-50 p-6 text-foreground hover:text-primary transition-colors bg-background/50 backdrop-blur-md border-b border-l border-border"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full lg:w-[70%] h-full flex items-center justify-center bg-black/5 relative overflow-hidden">
              <div className="w-full h-full p-4 md:p-12 flex items-center justify-center">
                <img
                  src={resolveAssetUrl(photo.url, resolvedCdnDomain)}
                  alt={photo.title}
                  className="max-w-full max-h-full object-contain shadow-2xl"
                />
              </div>
            </div>
            <div className="w-full lg:w-[30%] h-full flex flex-col border-l border-border bg-background overflow-y-auto">
              <div className="p-8 md:p-12 space-y-12 flex-1">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {photo.category.split(',').map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary border border-primary px-2 py-1"
                      >
                        {cat}
                      </span>
                    ))}
                    {photo.isFeatured && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                        <Star className="w-3 h-3 fill-current" />{' '}
                        {t('admin.feat')}
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif text-5xl leading-[0.9] text-foreground">
                    {photo.title}
                  </h2>
                </div>
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {t('gallery.palette')}
                  </h3>
                  <div className="flex gap-2">
                    {dominantColors.length > 0
                      ? dominantColors.map((color, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 border border-border transition-all hover:scale-110"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))
                      : [...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 bg-muted animate-pulse"
                          />
                        ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                      {t('gallery.resolution')}
                    </p>
                    <p className="font-mono text-sm">
                      {photo.width} × {photo.height}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                      {t('gallery.size')}
                    </p>
                    <p className="font-mono text-sm">
                      {formatFileSize(photo.size)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                      {t('gallery.date')}
                    </p>
                    <p className="font-mono text-sm">
                      {new Date(photo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {photo.cameraModel || photo.aperture || photo.iso ? (
                  <div className="space-y-8 pt-8 border-t border-border">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2">
                        <Camera className="w-3 h-3" /> {t('gallery.equipment')}
                      </p>
                      <p className="font-serif text-xl">
                        {photo.cameraMake} {photo.cameraModel}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-border">
                        <p className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                          {t('gallery.aperture')}
                        </p>
                        <p className="font-mono text-lg">{photo.aperture}</p>
                      </div>
                      <div className="p-4 border border-border">
                        <p className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                          {t('gallery.shutter')}
                        </p>
                        <p className="font-mono text-lg">
                          {photo.shutterSpeed}
                        </p>
                      </div>
                      <div className="p-4 border border-border">
                        <p className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                          {t('gallery.iso')}
                        </p>
                        <p className="font-mono text-lg">{photo.iso}</p>
                      </div>
                      <div className="p-4 border border-border">
                        <p className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">
                          {t('gallery.focal')}
                        </p>
                        <p className="font-mono text-lg">{photo.focalLength}</p>
                      </div>
                    </div>
                    {photo.latitude && photo.longitude && (
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`,
                            '_blank'
                          )
                        }
                        className="mt-4 w-full py-3 bg-muted hover:bg-muted/80 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                      >
                        <MapPin className="w-3 h-3" /> View on Map
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="pt-8 border-t border-border opacity-50">
                    <p className="text-[10px] tracking-[0.2em] uppercase">
                      {t('gallery.no_exif')}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-border bg-muted/10">
                <button
                  onClick={() =>
                    window.open(
                      resolveAssetUrl(photo.url, resolvedCdnDomain),
                      '_blank'
                    )
                  }
                  className="w-full py-4 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  {t('gallery.download')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
