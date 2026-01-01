'use client'

import React, { useState, useMemo } from 'react'
import {
  LayoutGrid,
  List as ListIcon,
  Plus,
  Trash2,
  Globe,
  X,
  ImageIcon,
  Star,
  Search,
} from 'lucide-react'
import { PhotoDto, resolveAssetUrl, PublicSettingsDto } from '@/lib/api'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { CustomInput } from '@/components/ui/CustomInput'

interface PhotosTabProps {
  photos: PhotoDto[]
  categories: string[]
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
  categories,
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
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [onlyFeatured, setOnlyFeatured] = useState(false)
  const [sortBy, setSortBy] = useState<'upload-desc' | 'upload-asc' | 'taken-desc' | 'taken-asc'>('upload-desc')

  const resolvedCdnDomain = settings?.cdn_domain?.trim() || undefined

  const filteredPhotos = useMemo(() => {
    const filtered = photos.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        categoryFilter === 'all' || p.category.includes(categoryFilter)

      const matchesChannel =
        channelFilter === 'all' || p.storageProvider === channelFilter

      const matchesFeatured = !onlyFeatured || p.isFeatured

      return matchesSearch && matchesCategory && matchesChannel && matchesFeatured
    })

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'upload-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'upload-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'taken-desc':
          if (!a.takenAt && !b.takenAt) return 0
          if (!a.takenAt) return 1
          if (!b.takenAt) return -1
          return new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
        case 'taken-asc':
          if (!a.takenAt && !b.takenAt) return 0
          if (!a.takenAt) return 1
          if (!b.takenAt) return -1
          return new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
        default:
          return 0
      }
    })
  }, [photos, search, categoryFilter, channelFilter, onlyFeatured, sortBy])

  return (
    <div className="space-y-6">
      {/* Integrated Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border pb-6">
        {/* Left: Items info & Selection actions */}
        <div className="flex items-center space-x-6 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filteredPhotos.length > 0 && selectedIds.size === filteredPhotos.length}
              onChange={onSelectAll}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              {selectedIds.size > 0
                ? `${selectedIds.size} Selected`
                : `${filteredPhotos.length} Items`}
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
        </div>

        {/* Right: Search, Filters, Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 lg:justify-end">
          <CustomInput
            variant="search"
            icon={Search}
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClassName="w-full sm:w-64"
          />

          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Selector */}
            <CustomSelect
              value={sortBy}
              onChange={(value) => setSortBy(value as any)}
              options={[
                { value: 'upload-desc', label: t('admin.sort_upload_desc') },
                { value: 'upload-asc', label: t('admin.sort_upload_asc') },
                { value: 'taken-desc', label: t('admin.sort_taken_desc') },
                { value: 'taken-asc', label: t('admin.sort_taken_asc') },
              ]}
            />

            {/* Category Filter */}
            <CustomSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'all', label: `${t('ui.category_filter')}: ${t('gallery.all')}` },
                ...categories.filter(c => c !== 'all').map(cat => ({
                  value: cat,
                  label: cat,
                })),
              ]}
            />

            {/* Channel Filter */}
            <CustomSelect
              value={channelFilter}
              onChange={setChannelFilter}
              options={[
                { value: 'all', label: `${t('ui.channel_filter')}: ${t('gallery.all')}` },
                { value: 'local', label: 'Local' },
                { value: 'r2', label: 'Cloudflare R2' },
                { value: 'github', label: 'GitHub' },
              ]}
            />

            {/* Featured Filter (Switch) */}
            <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border border-border">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                {t('admin.feat')}
              </span>
              <button
                onClick={() => setOnlyFeatured(!onlyFeatured)}
                className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  onlyFeatured ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none block h-3 w-3 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    onlyFeatured ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="h-6 w-[1px] bg-border mx-1 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <div className="flex bg-muted p-1 border border-border">
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={`p-1.5 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onViewModeChange('list')}
                  className={`p-1.5 transition-all ${
                    viewMode === 'list'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                className="p-2 border border-border hover:text-primary hover:border-primary transition-colors text-muted-foreground"
                onClick={onRefresh}
                title={t('common.refresh')}
              >
                <Globe className="w-4 h-4" />
              </button>

              <button
                onClick={onAdd}
                className="flex items-center px-4 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all ml-2"
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                {t('admin.add_new')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-destructive text-destructive text-xs tracking-widest uppercase flex items-center space-x-2">
          <X className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-y-auto custom-scrollbar">
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
            {filteredPhotos.map((photo) =>
              viewMode === 'grid' ? (
                <div
                  key={photo.id}
                  className={`group relative cursor-pointer bg-muted border overflow-hidden ${
                    selectedIds.has(photo.id)
                      ? 'border-primary ring-1 ring-primary'
                      : 'border-transparent'
                  }`}
                  onClick={() => onPreview(photo)}
                >
                  <div className="aspect-[4/5]">
                    <img
                      src={resolveAssetUrl(
                        photo.thumbnailUrl || photo.url,
                        resolvedCdnDomain
                      )}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Checkbox - Always visible on mobile, hover on desktop */}
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(photo.id)}
                      onChange={() => onSelect(photo.id)}
                      className="w-4 h-4 accent-primary cursor-pointer border-white shadow-lg"
                    />
                  </div>

                  {/* Featured Badge - Always visible if featured */}
                  {photo.isFeatured && (
                    <div className="absolute top-2 left-8 px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest z-10 shadow-lg">
                      {t('admin.feat')}
                    </div>
                  )}

                  {/* Gradient Overlay - Desktop only */}
                  <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Action Buttons - Always visible on mobile, hover on desktop */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 z-20 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFeatured(photo)
                      }}
                      className={`p-2 bg-black/70 backdrop-blur-sm text-white hover:text-amber-500 transition-colors shadow-lg ${
                        photo.isFeatured ? 'text-amber-500' : ''
                      }`}
                      title={photo.isFeatured ? 'Remove from featured' : 'Add to featured'}
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
                      className="p-2 bg-black/70 backdrop-blur-sm text-white hover:text-destructive transition-colors shadow-lg"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Info - Desktop hover only */}
                  <div className="hidden md:block absolute bottom-0 left-0 w-full p-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 pointer-events-none z-10">
                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-1">
                      {photo.category.split(',')[0]}
                    </p>
                    <h3 className="text-sm font-serif text-white leading-tight truncate">
                      {photo.title}
                    </h3>
                  </div>

                  {/* Mobile Info - Always visible on mobile */}
                  <div className="md:hidden absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-10">
                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-0.5 truncate">
                      {photo.category.split(',')[0]}
                    </p>
                    <h3 className="text-xs font-serif text-white leading-tight truncate">
                      {photo.title}
                    </h3>
                  </div>
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
                      className="w-full h-full object-cover"
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
            {filteredPhotos.length === 0 && (
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
    </div>
  )
}