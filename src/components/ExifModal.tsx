'use client'

import { PhotoDto } from '@/lib/api'
import { X, Camera, Aperture, Timer, Gauge, Calendar, MapPin, Monitor, Code, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface ExifModalProps {
  photo: PhotoDto | null
  isOpen: boolean
  onClose: () => void
}

export default function ExifModal({ photo, isOpen, onClose }: ExifModalProps) {
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
      label: '相机',
      value: [photo.cameraMake, photo.cameraModel].filter(Boolean).join(' '),
      show: !!(photo.cameraMake || photo.cameraModel),
    },
    {
      icon: Camera,
      label: '镜头',
      value: photo.lens,
      show: !!photo.lens,
    },
    {
      icon: Aperture,
      label: '光圈',
      value: photo.aperture,
      show: !!photo.aperture,
    },
    {
      icon: Timer,
      label: '快门',
      value: photo.shutterSpeed,
      show: !!photo.shutterSpeed,
    },
    {
      icon: Gauge,
      label: 'ISO',
      value: photo.iso?.toString(),
      show: !!photo.iso,
    },
    {
      icon: Camera,
      label: '焦距',
      value: photo.focalLength,
      show: !!photo.focalLength,
    },
    {
      icon: Calendar,
      label: '拍摄时间',
      value: photo.takenAt ? new Date(photo.takenAt).toLocaleString('zh-CN') : undefined,
      show: !!photo.takenAt,
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
      label: '方向',
      value: photo.orientation ? `${photo.orientation}` : undefined,
      show: !!photo.orientation,
    },
    {
      icon: Code,
      label: '软件',
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
            className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 md:inset-8 lg:inset-16 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <div className="relative w-full h-full max-w-7xl bg-card border border-border shadow-xl rounded-[32px] overflow-hidden flex flex-col lg:flex-row">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md text-foreground transition-all active:scale-95 group"
              >
                <X className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
              </button>

              {/* Left Side - Photo Display */}
              <div className="w-full lg:w-[70%] h-[40%] lg:h-full flex items-center justify-center bg-black/5 dark:bg-white/5 p-8 relative">
                <div className="relative w-full h-full">
                  <Image
                    src={photo.url}
                    alt={photo.title}
                    fill
                    className="object-contain drop-shadow-2xl"
                    sizes="(max-width: 768px) 100vw, 70vw"
                    priority
                  />
                </div>
              </div>

              {/* Right Side - Info Panel */}
              <div className="w-full lg:w-[30%] h-[60%] lg:h-full flex flex-col bg-card border-t lg:border-t-0 lg:border-l border-border">
                {/* Title Section */}
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                    {photo.title}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="px-2.5 py-1 bg-muted rounded-full text-xs font-bold border border-border">
                      {photo.category}
                    </span>
                    <span className="font-mono">{photo.width} × {photo.height}</span>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* EXIF Info */}
                  {hasExif ? (
                    <div>
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                        拍摄参数
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {exifItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-muted/30 border border-border rounded-xl transition-colors group"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <item.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="text-xs text-muted-foreground font-bold">
                                {item.label}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-foreground truncate">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* GPS Map Link */}
                      {photo.latitude && photo.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-sm font-bold transition-all"
                        >
                          <MapPin className="w-4 h-4" />
                          <span>在地图中查看</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-sm">暂无拍摄参数</p>
                    </div>
                  )}

                  {/* Basic Info */}
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                      其他信息
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">上传时间</span>
                        <span className="text-foreground font-bold">
                          {new Date(photo.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      {photo.takenAt && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground font-medium">拍摄日期</span>
                          <span className="text-foreground font-bold">
                            {new Date(photo.takenAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
