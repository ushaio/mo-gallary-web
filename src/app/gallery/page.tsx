'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  Ruler,
  Star,
  X,
  LayoutGrid,
  StretchVertical,
  Clock,
  ZoomIn,
  ZoomOut,
  Filter,
  Maximize2,
  HardDrive,
  Loader2,
  Camera,
  Aperture,
  Timer,
  Gauge,
  MapPin,
  Code
} from 'lucide-react'
import { getCategories, getPhotos, resolveAssetUrl, type PhotoDto } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'

type ViewMode = 'grid' | 'masonry' | 'timeline'

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function GalleryPage() {
  const { t } = useLanguage()
  const [categories, setCategories] = useState<string[]>(['ALL'])
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [zoomLevel, setZoomLevel] = useState(3)

  const [photos, setPhotos] = useState<PhotoDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedPhoto, setSelectedPhoto] = useState<PhotoDto | null>(null)
  const [dominantColors, setDominantColors] = useState<string[]>([])

  // Color extraction logic
  useEffect(() => {
    if (selectedPhoto) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = resolveAssetUrl(selectedPhoto.url);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          canvas.width = 40; canvas.height = 40;
          ctx.drawImage(img, 0, 0, 40, 40);
          const imageData = ctx.getImageData(0, 0, 40, 40).data;
          const colorCounts: Record<string, number> = {};
          for (let i = 0; i < imageData.length; i += 16) {
            const r = Math.round(imageData[i] / 10) * 10;
            const g = Math.round(imageData[i+1] / 10) * 10;
            const b = Math.round(imageData[i+2] / 10) * 10;
            const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
            colorCounts[hex] = (colorCounts[hex] || 0) + 1;
          }
          const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(c => c[0]);
          setDominantColors(sorted);
        } catch (e) {
          console.error('Palette extraction failed', e);
        }
      };
    } else {
      setDominantColors([]);
    }
  }, [selectedPhoto])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getCategories()
        if (cancelled) return
        setCategories(data.includes('全部') ? data.map(c => c === '全部' ? 'ALL' : c) : ['ALL', ...data])
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load categories')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setError('')
    setLoading(true)
    ;(async () => {
      try {
        const queryCategory = selectedCategory === 'ALL' ? '全部' : selectedCategory
        const data = await getPhotos({ category: queryCategory, limit: 100 })
        if (cancelled) return
        setPhotos(data)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load photos')
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedCategory])

  const groupedPhotos = useMemo(() => {
    if (viewMode !== 'timeline') return []
    const groups: { title: string; photos: PhotoDto[] }[] = []
    const sorted = [...photos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    sorted.forEach(photo => {
      const date = new Date(photo.createdAt)
      const title = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}`
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.title === title) {
        lastGroup.photos.push(photo)
      } else {
        groups.push({ title, photos: [photo] })
      }
    })
    return groups
  }, [photos, viewMode])

  const gridColsClass = useMemo(() => {
    if (viewMode === 'masonry') return ''
    switch (zoomLevel) {
      case 1: return 'grid-cols-5 sm:grid-cols-8 lg:grid-cols-12 gap-1'
      case 2: return 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2'
      case 3: return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3'
      case 4: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
      default: return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3'
    }
  }, [zoomLevel, viewMode])

  const masonryColsClass = useMemo(() => {
    switch (zoomLevel) {
      case 1: return 'columns-5 sm:columns-8 lg:columns-12 gap-1'
      case 2: return 'columns-4 sm:columns-6 lg:columns-10 gap-2'
      case 3: return 'columns-3 sm:columns-4 lg:columns-6 gap-3'
      case 4: return 'columns-2 sm:columns-3 lg:columns-4 gap-4'
      default: return 'columns-3 sm:columns-4 lg:columns-6 gap-3'
    }
  }, [zoomLevel])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1920px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-border pb-6">
          <div>
            <h1 className="font-serif text-5xl md:text-7xl font-light tracking-tighter text-foreground">
              {t('gallery.title')}
            </h1>
            <p className="font-sans text-xs tracking-[0.2em] text-muted-foreground mt-2 uppercase">
              {photos.length} {t('gallery.count_suffix')}
            </p>
          </div>
          
          <div className="flex items-center gap-6 mt-6 md:mt-0">
            <button 
              onClick={() => setZoomLevel(prev => Math.max(1, prev - 1))}
              className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-20"
              disabled={zoomLevel === 1}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(4, prev + 1))}
              className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-20"
              disabled={zoomLevel === 4}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="sticky top-20 z-30 mb-8 py-3 bg-background/95 backdrop-blur-xl border-b border-border flex flex-col sm:flex-row items-center justify-between gap-6 transition-all">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`pb-1 text-[10px] font-bold tracking-[0.2em] uppercase transition-all whitespace-nowrap border-b-2 ${
                  selectedCategory === category
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {category === 'ALL' ? t('gallery.all') : category}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {[
              { mode: 'grid', icon: LayoutGrid },
              { mode: 'masonry', icon: StretchVertical },
              { mode: 'timeline', icon: Clock }
            ].map((item) => (
              <button
                key={item.mode}
                onClick={() => setViewMode(item.mode as ViewMode)}
                className={`p-2 transition-colors rounded-lg ${viewMode === item.mode ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <item.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-12 p-4 border border-destructive text-destructive font-sans text-sm tracking-widest uppercase">
            {t('common.error')}: {error}
          </div>
        )}

        {loading ? (
          <div className="py-48 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border border-primary border-t-transparent animate-spin rounded-full" />
            <p className="text-xs font-sans tracking-[0.3em] uppercase text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'timeline' ? (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-24"
              >
                {groupedPhotos.map((group) => (
                  <div key={group.title} className="relative">
                    <div className="sticky top-40 z-10 mb-8 bg-background py-2">
                       <h2 className="font-serif text-4xl text-foreground">
                        {group.title}
                        <span className="font-sans text-xs ml-4 tracking-widest text-muted-foreground align-middle">
                          ({group.photos.length})
                        </span>
                      </h2>
                    </div>

                    <div className={`grid ${gridColsClass}`}>
                      {group.photos.map((photo, index) => (
                        <PhotoCard 
                          key={photo.id} 
                          photo={photo} 
                          index={index} 
                          zoomLevel={zoomLevel} 
                          onClick={() => setSelectedPhoto(photo)} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : viewMode === 'masonry' ? (
              <motion.div
                key="masonry"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={masonryColsClass}
              >
                {photos.map((photo, index) => (
                  <div key={photo.id} className="mb-3 break-inside-avoid">
                    <PhotoCard 
                      photo={photo} 
                      index={index} 
                      zoomLevel={zoomLevel} 
                      onClick={() => setSelectedPhoto(photo)} 
                    />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`grid ${gridColsClass}`}
              >
                {photos.map((photo, index) => (
                  <PhotoCard 
                    key={photo.id} 
                    photo={photo} 
                    index={index} 
                    zoomLevel={zoomLevel} 
                    onClick={() => setSelectedPhoto(photo)} 
                  />
                ))}
              </motion.div>
            )}

            {photos.length === 0 && !error && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-48 text-center"
              >
                <p className="font-serif text-2xl text-muted-foreground italic">{t('gallery.empty')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Modal - Sharp & Brutal */}
        <AnimatePresence>
          {selectedPhoto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-0 md:p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full h-full max-w-[1800px] bg-background border border-border flex flex-col lg:flex-row overflow-hidden"
              >
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-0 right-0 z-50 p-6 text-foreground hover:text-primary transition-colors bg-background/50 backdrop-blur-md border-b border-l border-border"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Image Area */}
                <div className="w-full lg:w-[70%] h-full flex items-center justify-center bg-black/5 relative overflow-hidden">
                  <div className="w-full h-full p-4 md:p-12 flex items-center justify-center">
                    <img 
                      src={resolveAssetUrl(selectedPhoto.url)} 
                      alt={selectedPhoto.title}
                      className="max-w-full max-h-full object-contain shadow-2xl"
                    />
                  </div>
                </div>

                {/* Info Sidebar */}
                <div className="w-full lg:w-[30%] h-full border-l border-border bg-background overflow-y-auto">
                  <div className="p-8 md:p-12 space-y-12">
                    <div className="space-y-4">
                       <div className="flex flex-wrap gap-2">
                        {selectedPhoto.category.split(',').map(cat => (
                          <span key={cat} className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary border border-primary px-2 py-1">
                            {cat}
                          </span>
                        ))}
                        {selectedPhoto.isFeatured && (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                            <Star className="w-3 h-3 fill-current" /> {t('home.curated')}
                          </span>
                        )}
                      </div>
                      <h2 className="font-serif text-5xl leading-[0.9] text-foreground">{selectedPhoto.title}</h2>
                    </div>

                    {/* Color Palette */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('gallery.palette')}</h3>
                      <div className="flex gap-2">
                        {dominantColors.length > 0 ? dominantColors.map((color, i) => (
                          <div 
                            key={i} 
                            className="w-8 h-8 border border-border transition-all hover:scale-110"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        )) : (
                          [...Array(5)].map((_, i) => (
                            <div key={i} className="w-8 h-8 bg-muted animate-pulse" />
                          ))
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{t('gallery.resolution')}</p>
                          <p className="font-mono text-sm">{selectedPhoto.width} × {selectedPhoto.height}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{t('gallery.size')}</p>
                          <p className="font-mono text-sm">{formatFileSize(selectedPhoto.size)}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{t('gallery.date')}</p>
                          <p className="font-mono text-sm">{new Date(selectedPhoto.takenAt || selectedPhoto.createdAt).toLocaleDateString(t('common.date_locale') || 'en-US')}</p>
                       </div>
                    </div>

                    {(selectedPhoto.cameraModel || selectedPhoto.aperture || selectedPhoto.iso) ? (
                      <div className="space-y-8 pt-8 border-t border-border">
                        <div className="space-y-2">
                           <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2">
                             <Camera className="w-3 h-3" /> {t('gallery.equipment')}
                           </p>
                           <p className="font-serif text-xl">{selectedPhoto.cameraMake} {selectedPhoto.cameraModel}</p>
                           {selectedPhoto.lens && <p className="text-xs text-muted-foreground">{selectedPhoto.lens}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 border border-border">
                              <p className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">{t('gallery.aperture')}</p>
                              <p className="font-mono text-lg">{selectedPhoto.aperture}</p>
                           </div>
                           <div className="p-4 border border-border">
                              <p className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">{t('gallery.shutter')}</p>
                              <p className="font-mono text-lg">{selectedPhoto.shutterSpeed}</p>
                           </div>
                           <div className="p-4 border border-border">
                              <p className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">{t('gallery.iso')}</p>
                              <p className="font-mono text-lg">{selectedPhoto.iso}</p>
                           </div>
                           <div className="p-4 border border-border">
                              <p className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">{t('gallery.focal')}</p>
                              <p className="font-mono text-lg">{selectedPhoto.focalLength}</p>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-8 border-t border-border opacity-50">
                        <p className="text-[10px] tracking-[0.2em] uppercase">{t('gallery.no_exif')}</p>
                      </div>
                    )}

                    <div className="pt-8">
                       <button 
                        onClick={() => window.open(resolveAssetUrl(selectedPhoto.url), '_blank')}
                        className="w-full py-4 bg-foreground text-background font-bold tracking-[0.2em] text-xs uppercase hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {t('gallery.download')}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PhotoCard({ photo, index, zoomLevel, onClick }: { 
  photo: PhotoDto; 
  index: number; 
  zoomLevel: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.05, 0.5) }}
      className="group w-full text-left outline-none block relative"
      onClick={onClick}
    >
      <div className={`relative overflow-hidden bg-muted ${zoomLevel <= 2 ? 'aspect-square' : 'aspect-[4/5]'}`}>
        <img
          src={resolveAssetUrl(photo.thumbnailUrl || photo.url)}
          alt={photo.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute bottom-0 left-0 w-full p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <p className="bg-background/90 text-foreground text-[10px] font-bold tracking-widest uppercase inline-block px-2 py-1">
            {photo.title}
          </p>
        </div>
      </div>
    </motion.button>
  )
}