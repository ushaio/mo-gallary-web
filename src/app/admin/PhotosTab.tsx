'use client'

import {
  LayoutGrid,
  List as ListIcon,
  Plus,
  Trash2,
  Globe,
  X,
  ImageIcon,
  Star
} from 'lucide-react'
import { PhotoDto, resolveAssetUrl, PublicSettingsDto } from '@/lib/api'

interface PhotosTabProps {
  photos: PhotoDto[]
  loading: boolean
  error: string
  viewMode: 'grid' | 'list'
  selectedIds: Set<string>
  onViewModeChange: (mode: 'grid' | 'list') => void
  onSelect: (id: string) => void
  onSelectAll: () => void
  onDelete: (id?: string) => void
  onRefresh: () => void
  onToggleFeatured: (photo: PhotoDto) => void
  onAdd: () => void
  onPreview: (photo: PhotoDto) => void
  t: (key: string) => string
  settings: PublicSettingsDto | null
}

export function PhotosTab({
  photos,
  loading,
  error,
  viewMode,
  selectedIds,
  onViewModeChange,
  onSelect,
  onSelectAll,
  onDelete,
  onRefresh,
  onToggleFeatured,
  onAdd,
  onPreview,
  t,
  settings,
}: PhotosTabProps) {
  const resolvedCdnDomain = settings?.cdn_domain?.trim() || undefined

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={photos.length > 0 && selectedIds.size === photos.length}
              onChange={onSelectAll}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {selectedIds.size > 0
                ? `${selectedIds.size} Selected`
                : `${photos.length} Items`}
            </span>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-4">
              <div className="h-4 w-[1px] bg-border"></div>
              <button
                onClick={() => onDelete()}
                className="text-destructive hover:opacity-80 transition-opacity flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
          <div className="h-4 w-[1px] bg-border mx-2"></div>
          <button
            className="hover:text-primary transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            onClick={onRefresh}
          >
            <Globe className="w-3 h-3" /> {t('common.refresh')}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-muted p-1 border border-border">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-background text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-background text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('admin.add_new')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-destructive text-destructive text-xs tracking-widest uppercase flex items-center space-x-2">
          <X className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4'
              : 'flex flex-col border border-border'
          }
        >
          {photos.map((photo) =>
            viewMode === 'grid' ? (
              <div
                key={photo.id}
                className={`group relative cursor-pointer bg-muted border ${
                  selectedIds.has(photo.id)
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-transparent'
                }`}
                onClick={() => onPreview(photo)}
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={resolveAssetUrl(
                      photo.thumbnailUrl || photo.url,
                      resolvedCdnDomain
                    )}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div
                  className="absolute top-2 left-2 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(photo.id)}
                    onChange={() => onSelect(photo.id)}
                    className="w-4 h-4 accent-primary cursor-pointer border-white"
                  />
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFeatured(photo)
                    }}
                    className={`p-2 bg-background/90 backdrop-blur-sm text-foreground hover:text-amber-500 transition-colors ${
                      photo.isFeatured ? 'text-amber-500' : ''
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        photo.isFeatured ? 'fill-current' : ''
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(photo.id)
                    }}
                    className="p-2 bg-background/90 backdrop-blur-sm text-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none">
                  <div className="bg-background/90 p-2 backdrop-blur-sm">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest truncate text-foreground">
                      {photo.title}
                    </h3>
                    <div className="flex gap-1 mt-1">
                      {photo.category
                        .split(',')
                        .slice(0, 1)
                        .map((cat) => (
                          <span
                            key={cat}
                            className="text-[8px] font-mono text-muted-foreground uppercase"
                          >
                            {cat}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
                {photo.isFeatured && (
                  <div className="absolute top-2 left-8 px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest z-10">
                    {t('admin.feat')}
                  </div>
                )}
              </div>
            ) : (
              <div
                key={photo.id}
                className={`flex items-center gap-4 p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${
                  selectedIds.has(photo.id) ? 'bg-primary/5' : ''
                }`}
                onClick={() => onPreview(photo)}
              >
                <div
                  className="flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(photo.id)}
                    onChange={() => onSelect(photo.id)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </div>
                <div className="w-12 h-12 flex-shrink-0 bg-muted border border-border overflow-hidden">
                  <img
                    src={resolveAssetUrl(
                      photo.thumbnailUrl || photo.url,
                      resolvedCdnDomain
                    )}
                    alt=""
                    className="w-full h-full object-cover grayscale"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest truncate text-foreground">
                    {photo.title}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">
                    {photo.category}
                  </p>
                </div>
                <div className="hidden md:block text-[10px] font-mono text-muted-foreground w-32">
                  {photo.width} × {photo.height}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFeatured(photo)
                    }}
                    className={`p-2 hover:bg-muted transition-colors ${
                      photo.isFeatured
                        ? 'text-amber-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        photo.isFeatured ? 'fill-current' : ''
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(photo.id)
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          )}
          {photos.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mb-4 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest">
                {t('admin.no_photos')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
