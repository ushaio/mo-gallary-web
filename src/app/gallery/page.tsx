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
  Monitor,
  Code
} from 'lucide-react'
import { getCategories, getPhotos, resolveAssetUrl, type PhotoDto } from '@/lib/api'

type ViewMode = 'grid' | 'masonry' | 'timeline'

function formatFileSize(bytes?: number): string {
  if (!bytes) return '未知'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function GalleryPage() {
  const [categories, setCategories] = useState<string[]>(['全部'])
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [zoomLevel, setZoomLevel] = useState(3)

  const [photos, setPhotos] = useState<PhotoDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedPhoto, setSelectedPhoto] = useState<PhotoDto | null>(null)
  const [dominantColors, setDominantColors] = useState<string[]>([])

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
        setCategories(data.includes('全部') ? data : ['全部', ...data])
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '加载分类失败')
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
        const data = await getPhotos({ category: selectedCategory, limit: 100 })
        if (cancelled) return
        setPhotos(data)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '加载照片失败')
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
      const title = `${date.getFullYear()}年${date.getMonth() + 1}月`
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
      case 1: return 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2'
      case 2: return 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3'
      case 3: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4'
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
      default: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4'
    }
  }, [zoomLevel, viewMode])

  const masonryColsClass = useMemo(() => {
    switch (zoomLevel) {
      case 1: return 'columns-4 sm:columns-6 lg:columns-10 gap-2'
      case 2: return 'columns-3 sm:columns-5 lg:columns-8 gap-3'
      case 3: return 'columns-2 sm:columns-3 lg:columns-5 gap-4'
      case 4: return 'columns-1 sm:columns-2 lg:columns-3 gap-6'
      default: return 'columns-2 sm:columns-3 lg:columns-5 gap-4'
    }
  }, [zoomLevel])

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">相册展示</h1>
          <p className="text-xs text-muted-foreground mt-0.5">共 {photos.length} 张摄影作品</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-4 z-30 mb-8 px-4 py-2 bg-background/70 backdrop-blur-xl border border-white/10 rounded-full shadow-lg flex items-center gap-4 overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 border-r pr-4 border-muted">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0" />
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex items-center p-0.5 bg-muted/30 rounded-full shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('masonry')}
            className={`p-1.5 rounded-full transition-colors ${viewMode === 'masonry' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <StretchVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`p-1.5 rounded-full transition-colors ${viewMode === 'timeline' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 shrink-0 border-l pl-4 border-muted text-muted-foreground">
          <button 
            onClick={() => setZoomLevel(prev => Math.max(1, prev - 1))}
            className="p-1 hover:text-foreground disabled:opacity-20"
            disabled={zoomLevel === 1}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="text-[10px] font-mono w-4 text-center select-none">{zoomLevel}</div>
          <button 
            onClick={() => setZoomLevel(prev => Math.min(4, prev + 1))}
            className="p-1 hover:text-foreground disabled:opacity-20"
            disabled={zoomLevel === 4}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-destructive/5 border border-destructive/10 text-destructive rounded-lg text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">加载中</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'timeline' ? (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              {groupedPhotos.map((group) => (
                <div key={group.title} className="relative pl-6 sm:pl-10">
                  <div className="absolute left-0 top-1 bottom-0 w-px bg-muted" />
                  <div className="absolute left-[-2px] top-1.5 w-1 h-1 rounded-full bg-primary" />
                  
                  <div className="mb-4">
                    <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
                      {group.title}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        / {group.photos.length}
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
                <div key={photo.id} className="mb-4 break-inside-avoid">
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
              className="py-32 text-center"
            >
              <p className="text-xs text-muted-foreground">该分类下还没有照片</p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Modal with Progressive Loading and Blur Background */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            {/* Ambient Blurred Background (Uses thumbnail first, then high-res) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0 bg-cover bg-center scale-110"
              style={{ 
                backgroundImage: `url(${resolveAssetUrl(selectedPhoto.thumbnailUrl || selectedPhoto.url)})`,
                filter: 'blur(60px) brightness(0.3)'
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative z-10 bg-background/60 dark:bg-black/60 backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-[32px] overflow-hidden w-full max-w-6xl h-[85vh] shadow-2xl flex flex-col lg:flex-row"
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-6 right-6 z-30 p-2.5 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md transition-all active:scale-95 group"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image Display Area */}
              <div className="w-full lg:w-[75%] h-full flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-black/5 dark:bg-white/5">
                <ProgressiveImage 
                  src={resolveAssetUrl(selectedPhoto.url)} 
                  placeholderSrc={resolveAssetUrl(selectedPhoto.thumbnailUrl || selectedPhoto.url)} 
                  alt={selectedPhoto.title}
                />
              </div>

              {/* Sidebar Info Area */}
              <div className="w-full lg:w-[30%] h-full flex flex-col border-l border-white/10 overflow-y-auto bg-white/40 dark:bg-black/40">
                <div className="p-8 flex-1 space-y-10">
                  {/* Header */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.category.split(',').map(cat => (
                        <span key={cat} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                          {cat}
                        </span>
                      ))}
                      {selectedPhoto.isFeatured && (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                          <Star className="w-3 h-3 fill-current" /> 精选作品
                        </span>
                      )}
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter leading-tight text-foreground">{selectedPhoto.title}</h2>
                  </div>

                  {/* Color Palette */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">色彩分析 / Palette</h3>
                    <div className="flex gap-2">
                      {dominantColors.length > 0 ? dominantColors.map((color, i) => (
                        <div 
                          key={i} 
                          className="w-8 h-8 rounded-lg shadow-sm border border-white/10 transition-all hover:scale-110 cursor-help hover:z-10"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      )) : (
                        [...Array(5)].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Metadata Card */}
                  <div className="space-y-1 p-1 rounded-[24px] bg-muted/30 border border-white/10 shadow-inner">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                          <Ruler className="w-4 h-4" />
                          <span className="text-xs font-semibold">分辨率</span>
                        </div>
                        <span className="text-xs font-mono font-bold">{selectedPhoto.width} × {selectedPhoto.height}</span>
                      </div>

                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                          <HardDrive className="w-4 h-4" />
                          <span className="text-xs font-semibold">大小</span>
                        </div>
                        <span className="text-xs font-mono font-bold">{formatFileSize(selectedPhoto.size)}</span>
                      </div>

                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs font-semibold">拍摄时间</span>
                        </div>
                        <span className="text-xs font-bold">{new Date(selectedPhoto.takenAt || selectedPhoto.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* EXIF Section */}
                  {(selectedPhoto.cameraModel || selectedPhoto.aperture || selectedPhoto.iso) ? (
                    <div className="space-y-6 pt-6 border-t border-white/10">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">拍摄参数 / EXIF</h3>
                      
                      <div className="grid grid-cols-1 gap-5">
                        {(selectedPhoto.cameraMake || selectedPhoto.cameraModel) && (
                          <div className="flex items-start gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                              <Camera className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-0.5">设备</p>
                              <p className="text-sm font-bold truncate leading-tight">{selectedPhoto.cameraMake} {selectedPhoto.cameraModel}</p>
                              {selectedPhoto.lens && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{selectedPhoto.lens}</p>}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { icon: Aperture, label: '光圈', value: selectedPhoto.aperture },
                            { icon: Timer, label: '快门', value: selectedPhoto.shutterSpeed },
                            { icon: Gauge, label: 'ISO', value: selectedPhoto.iso },
                            { icon: ZoomIn, label: '焦距', value: selectedPhoto.focalLength },
                          ].filter(i => i.value).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                              <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              <div>
                                <p className="text-[8px] text-muted-foreground uppercase font-bold">{item.label}</p>
                                <p className="text-xs font-black">{item.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {selectedPhoto.latitude && selectedPhoto.longitude && (
                          <div className="pt-2">
                            <button 
                              onClick={() => window.open(`https://www.google.com/maps?q=${selectedPhoto.latitude},${selectedPhoto.longitude}`, '_blank')}
                              className="w-full py-3 bg-muted hover:bg-muted/80 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all border border-white/10 group"
                            >
                              <MapPin className="w-3.5 h-3.5 group-hover:animate-bounce" /> 定位拍摄地点
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-6 border-t border-white/10 text-center py-10">
                      <Code className="w-8 h-8 mx-auto mb-3 opacity-10" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">无拍摄元数据 / No Metadata</p>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="p-6 border-t border-white/10 bg-black/5 dark:bg-white/5">
                  <button 
                    onClick={() => window.open(resolveAssetUrl(selectedPhoto.url), '_blank')}
                    className="w-full py-4 bg-foreground text-background dark:bg-white dark:text-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    查看原图
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProgressiveImage({ src, placeholderSrc, alt }: { src: string; placeholderSrc: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Thumbnail/Placeholder (Should be instant) */}
      <img
        src={placeholderSrc}
        alt={alt}
        className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
      />
      
      {/* High-res Image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`absolute max-w-full max-h-full object-contain transition-opacity duration-500 shadow-2xl rounded-sm ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Loading Spinner in Bottom-Right */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.01, 0.5) }}
      className="group w-full text-left outline-none"
      onClick={onClick}
    >
      <div className={`relative overflow-hidden rounded-xl bg-muted/20 transition-all duration-300 group-hover:shadow-md ${zoomLevel <= 2 ? 'aspect-square' : 'aspect-[3/4]'}`}>
        <img
          src={resolveAssetUrl(photo.thumbnailUrl || photo.url)}
          alt={photo.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 space-y-2">
            <div className="flex flex-wrap gap-1">
              {photo.category.split(',').slice(0, 2).map(cat => (
                <span key={cat} className="px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[8px] font-black text-white uppercase tracking-widest">
                  {cat}
                </span>
              ))}
            </div>
            <p className="text-white text-xs font-black truncate tracking-tight">{photo.title}</p>
          </div>
        </div>

        {photo.isFeatured && (
          <div className="absolute top-3 left-3 p-1.5 bg-amber-500/90 backdrop-blur-md rounded-full text-white shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform">
            <Star className="w-3 h-3 fill-current" />
          </div>
        )}
      </div>
    </motion.button>
  )
}
