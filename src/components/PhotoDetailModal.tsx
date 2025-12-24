'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Camera,
  Aperture,
  Timer,
  Gauge,
  Calendar,
  MapPin,
  Monitor,
  Code,
  Download,
  Info,
  Star,
} from 'lucide-react'
import { PhotoDto, resolveAssetUrl } from '@/lib/api'
import { useSettings } from '@/contexts/SettingsContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatFileSize } from '@/lib/utils'

interface PhotoDetailModalProps {
  photo: PhotoDto | null
  isOpen: boolean
  onClose: () => void
}

export function PhotoDetailModal({
  photo,
  isOpen,
  onClose,
}: PhotoDetailModalProps) {
  const { settings } = useSettings()
  const { t, locale } = useLanguage()
  const [showInfo, setShowInfo] = useState(true)

  if (!photo) return null

  const hasExif = !!(
    photo.cameraMake ||
    photo.cameraModel ||
    photo.lens ||
    photo.focalLength ||
    photo.aperture ||
    photo.shutterSpeed ||
    photo.iso ||
    photo.takenAt
  )

  const exifItems = [
    {
      icon: Camera,
      label: t('gallery.equipment'),
      value: [photo.cameraMake, photo.cameraModel].filter(Boolean).join(' '),
      show: !!(photo.cameraMake || photo.cameraModel),
    },
    {
      icon: Camera,
      label: 'Lens',
      value: photo.lens,
      show: !!photo.lens,
    },
    {
      icon: Aperture,
      label: t('gallery.aperture'),
      value: photo.aperture,
      show: !!photo.aperture,
    },
    {
      icon: Timer,
      label: t('gallery.shutter'),
      value: photo.shutterSpeed,
      show: !!photo.shutterSpeed,
    },
    {
      icon: Gauge,
      label: t('gallery.iso'),
      value: photo.iso?.toString(),
      show: !!photo.iso,
    },
    {
      icon: Camera,
      label: t('gallery.focal'),
      value: photo.focalLength,
      show: !!photo.focalLength,
    },
    {
      icon: Calendar,
      label: t('gallery.date'),
      value: photo.createdAt
        ? new Date(photo.createdAt).toLocaleDateString(locale)
        : undefined,
      show: !!photo.createdAt,
    },
    {
      icon: MapPin,
      label: 'GPS',
      value:
        photo.latitude && photo.longitude
          ? `${photo.latitude.toFixed(4)}, ${photo.longitude.toFixed(4)}`
          : undefined,
      show: !!(photo.latitude && photo.longitude),
    },
    {
      icon: Monitor,
      label: 'Orientation',
      value: photo.orientation ? `${photo.orientation}` : undefined,
      show: !!photo.orientation,
    },
    {
      icon: Code,
      label: 'Software',
      value: photo.software,
      show: !!photo.software,
    },
  ].filter((item) => item.show)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 pointer-events-none"
          >
            <div
              className="relative w-full h-full max-w-7xl max-h-[90vh] bg-card border border-border shadow-2xl flex flex-col md:flex-row overflow-hidden pointer-events-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button - Floating */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 text-foreground/50 hover:text-foreground bg-background/50 hover:bg-background backdrop-blur-sm rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Side - Photo Display */}
              <div className="flex-1 relative bg-muted/30 flex items-center justify-center overflow-hidden h-[50vh] md:h-auto">
                {/* Checkered pattern background for transparency */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 0h10v10H0V0zm10 10h10v10H10V10z'/%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />

                <motion.img
                  layoutId={`photo-${photo.id}`}
                  src={resolveAssetUrl(photo.url, settings?.cdn_domain)}
                  alt={photo.title}
                  className="w-full h-full object-contain p-4 md:p-8"
                />

                {/* Mobile Info Toggle */}
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="md:hidden absolute bottom-4 right-4 p-2 bg-background/80 backdrop-blur border border-border rounded-full text-foreground/70"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>

              {/* Right Side - Info Panel */}
              <AnimatePresence mode="wait">
                {showInfo && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="w-full md:w-[350px] lg:w-[400px] border-t md:border-t-0 md:border-l border-border bg-card flex flex-col overflow-hidden"
                  >
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
                      {/* Header */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {photo.category.split(',').map((cat) => (
                            <span
                              key={cat}
                              className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary bg-primary/5 border border-primary/20 px-2 py-1 rounded-sm"
                            >
                              {cat}
                            </span>
                          ))}
                          {photo.isFeatured && (
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-sm flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              {t('admin.feat')}
                            </span>
                          )}
                        </div>
                        <h2 className="font-serif text-3xl leading-tight text-foreground">
                          {photo.title}
                        </h2>
                      </div>

                      {/* Technical Specs - Grid Layout */}
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground border-b border-border pb-2">
                          {t('gallery.technical_specs')}
                        </h3>
                        {hasExif ? (
                          <div className="grid grid-cols-2 gap-3">
                            {exifItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-muted/20 border border-border rounded-md flex flex-col gap-1.5 group hover:bg-muted/40 transition-colors"
                              >
                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                                  <item.icon className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-bold tracking-[0.1em] uppercase truncate">
                                    {item.label}
                                  </span>
                                </div>
                                <p
                                  className="text-xs font-mono text-foreground font-medium truncate"
                                  title={item.value}
                                >
                                  {item.value || '—'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            {t('gallery.no_exif')}
                          </p>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground border-b border-border pb-2">
                          {t('gallery.file_info')}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-muted/20 border border-border rounded-md">
                            <p className="text-[9px] font-bold tracking-[0.1em] text-muted-foreground uppercase mb-1">
                              {t('gallery.resolution')}
                            </p>
                            <p className="text-xs font-mono font-medium">
                              {photo.width} × {photo.height}
                            </p>
                          </div>
                          <div className="p-3 bg-muted/20 border border-border rounded-md">
                            <p className="text-[9px] font-bold tracking-[0.1em] text-muted-foreground uppercase mb-1">
                              {t('gallery.size')}
                            </p>
                            <p className="text-xs font-mono font-medium">
                              {formatFileSize(photo.size)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-border bg-muted/5">
                      <a
                        href={resolveAssetUrl(photo.url, settings?.cdn_domain)}
                        target="_blank"
                        className="w-full py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary/90 transition-all rounded-sm flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        {t('gallery.download')}
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
