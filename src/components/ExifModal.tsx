'use client'

import { PhotoDto } from '@/lib/api'
import { X, Camera, Aperture, Timer, Gauge, Calendar, MapPin, Monitor, Code } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
      label: 'GPS 位置',
      value:
        photo.latitude && photo.longitude
          ? `${photo.latitude.toFixed(6)}, ${photo.longitude.toFixed(6)}`
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
      label: '编辑软件',
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-background rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">照片信息</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(100vh-8rem)] md:max-h-[600px] p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  基本信息
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-start py-2 border-b">
                    <span className="text-sm text-muted-foreground">标题</span>
                    <span className="text-sm font-medium text-right">{photo.title}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b">
                    <span className="text-sm text-muted-foreground">分类</span>
                    <span className="text-sm font-medium text-right">{photo.category}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b">
                    <span className="text-sm text-muted-foreground">尺寸</span>
                    <span className="text-sm font-medium text-right">
                      {photo.width} × {photo.height} px
                    </span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b">
                    <span className="text-sm text-muted-foreground">上传时间</span>
                    <span className="text-sm font-medium text-right">
                      {new Date(photo.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* EXIF Info */}
              {hasExif ? (
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    拍摄参数 (EXIF)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {exifItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 p-3 bg-muted/50 rounded-xl"
                      >
                        <item.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium truncate">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* GPS Map Link */}
                  {photo.latitude && photo.longitude && (
                    <div className="mt-4">
                      <a
                        href={`https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>在地图中查看</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>此照片没有 EXIF 信息</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
