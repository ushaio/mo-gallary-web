
'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  FolderOpen,
  Plus,
  Trash2,
  ChevronLeft,
  Save,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
  Check,
  Layout,
  Settings,
  GripVertical,
  Search,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react'
import {
  getAdminAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addPhotosToAlbum,
  removePhotoFromAlbum,
  setAlbumCover,
  reorderAlbums,
  type AlbumDto,
  type PhotoDto,
  ApiUnauthorizedError,
} from '@/lib/api'
import { CustomInput } from '@/components/ui/CustomInput'
import { useSettings } from '@/contexts/SettingsContext'
import { resolveAssetUrl } from '@/lib/api'

interface AlbumsTabProps {
  token: string | null
  photos: PhotoDto[]
  t: (key: string) => string
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
  onUnauthorized: () => void
}

type ViewMode = 'grid' | 'list'
type FilterStatus = 'all' | 'published' | 'draft'

export function AlbumsTab({ token, photos, t, notify, onUnauthorized }: AlbumsTabProps) {
  const { settings } = useSettings()
  const cdnDomain = settings?.cdn_domain || ''

  const [albums, setAlbums] = useState<AlbumDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentAlbum, setCurrentAlbum] = useState<AlbumDto | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'photos'>('overview')
  const [saving, setSaving] = useState(false)
  const [showPhotoSelector, setShowPhotoSelector] = useState(false)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set())
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // New filter states
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { loadAlbums() }, [token])

  const filteredAlbums = useMemo(() => {
    return albums.filter(album => {
      if (filterStatus === 'published' && !album.isPublished) return false
      if (filterStatus === 'draft' && album.isPublished) return false
      if (searchQuery && !album.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [albums, filterStatus, searchQuery])

  async function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(id)
  }

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) return
    const fromIndex = albums.findIndex(a => a.id === draggingId)
    const toIndex = albums.findIndex(a => a.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return
    const newAlbums = [...albums]
    const [moved] = newAlbums.splice(fromIndex, 1)
    newAlbums.splice(toIndex, 0, moved)
    setAlbums(newAlbums)
  }

  async function handleDragEnd() {
    setDraggingId(null)
    if (!token) return
    try {
      await reorderAlbums(token, albums.map((a, i) => ({ id: a.id, sortOrder: i })))
    } catch {
      notify(t('common.error'), 'error')
      await loadAlbums()
    }
  }

  async function loadAlbums() {
    if (!token) return
    try {
      setLoading(true)
      setAlbums(await getAdminAlbums(token))
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) { onUnauthorized(); return }
      notify(t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleCreateAlbum() {
    setCurrentAlbum({
      id: '', name: '', description: '', coverUrl: '', isPublished: false,
      sortOrder: albums.length, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), photos: [], photoCount: 0,
    })
    setActiveTab('overview')
  }

  async function handleDeleteAlbum(id: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (!token || !window.confirm(t('common.confirm') + '?')) return
    try {
      await deleteAlbum(token, id)
      notify(t('admin.notify_success'), 'success')
      if (currentAlbum?.id === id) setCurrentAlbum(null)
      await loadAlbums()
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) { onUnauthorized(); return }
      notify(t('common.error'), 'error')
    }
  }

  async function handleSaveAlbum() {
    if (!token || !currentAlbum || !currentAlbum.name.trim()) {
      notify(t('admin.album_name_required') || 'Please enter album name', 'error')
      return
    }
    try {
      setSaving(true)
      const isNew = !currentAlbum.id
      const data = { name: currentAlbum.name, description: currentAlbum.description || undefined, coverUrl: currentAlbum.coverUrl || undefined, isPublished: currentAlbum.isPublished, sortOrder: currentAlbum.sortOrder }
      const result = isNew ? await createAlbum(token, data) : await updateAlbum(token, currentAlbum.id, data)
      notify(isNew ? (t('admin.album_created') || 'Album created') : (t('admin.album_updated') || 'Album updated'), 'success')
      setCurrentAlbum(result)
      await loadAlbums()
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) { onUnauthorized(); return }
      notify(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish(album: AlbumDto, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (!token) return
    try {
      const updated = await updateAlbum(token, album.id, { isPublished: !album.isPublished })
      notify(t('admin.notify_success'), 'success')
      setAlbums(prev => prev.map(a => a.id === updated.id ? updated : a))
      if (currentAlbum?.id === updated.id) setCurrentAlbum(updated)
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) { onUnauthorized(); return }
      notify(t('common.error'), 'error')
    }
  }

  async function handleAddPhotos() {
    if (!token || !currentAlbum || selectedPhotoIds.size === 0) return
    try {
      setSaving(true)
      await addPhotosToAlbum(token, currentAlbum.id, Array.from(selectedPhotoIds))
      notify(t('admin.photos_added') || 'Photos added', 'success')
      setShowPhotoSelector(false)
      setSelectedPhotoIds(new Set())
      const updatedAlbums = await getAdminAlbums(token)
      setAlbums(updatedAlbums)
      const updatedCurrent = updatedAlbums.find(a => a.id === currentAlbum.id)
      if (updatedCurrent) setCurrentAlbum(updatedCurrent)
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) { onUnauthorized(); return }
      notify(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemovePhoto(photoId: string) {
    if (!token || !currentAlbum) return
    try {
      const updated = await removePhotoFromAlbum(token, currentAlbum.id, photoId)
      setCurrentAlbum(updated)
      setAlbums(prev => prev.map(a => a.id === updated.id ? updated : a))
      notify(t('admin.photo_removed') || 'Photo removed', 'success')
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) { onUnauthorized(); return }
      notify(t('common.error'), 'error')
    }
  }

  async function handleSetCover(photoId: string) {
    if (!token || !currentAlbum) return
    try {
      const updated = await setAlbumCover(token, currentAlbum.id, photoId)
      setCurrentAlbum(updated)
      setAlbums(prev => prev.map(a => a.id === updated.id ? updated : a))
      notify(t('admin.cover_set') || 'Cover set', 'success')
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) { onUnauthorized(); return }
      notify(t('common.error'), 'error')
    }
  }

  const availablePhotos = useMemo(() => {
    if (!currentAlbum) return photos
    const albumPhotoIds = new Set(currentAlbum.photos.map(p => p.id))
    return photos.filter(p => !albumPhotoIds.has(p.id))
  }, [photos, currentAlbum])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs font-mono uppercase">{t('common.loading')}</div>
  }

  // List View
  if (!currentAlbum) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-light tracking-wide">{t('admin.albums') || 'Albums'}</h2>
            <p className="text-xs text-muted-foreground mt-1">{filteredAlbums.length} of {albums.length}</p>
          </div>
          <button onClick={handleCreateAlbum} className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
            <Plus className="w-4 h-4" />
            {t('admin.new_album') || 'New Album'}
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 pb-4 border-b border-border/50">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('admin.search') || 'Search...'}
              className="w-full pl-10 pr-4 py-2 bg-muted/30 border-b border-border text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 bg-muted/30 p-1">
            <Filter className="w-4 h-4 text-muted-foreground mx-2" />
            {(['all', 'published', 'draft'] as FilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterStatus === status ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {status === 'all' ? t('common.all') || 'All' : status === 'published' ? t('admin.published') || 'Published' : t('admin.draft') || 'Draft'}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex bg-muted/30 p-1">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {filteredAlbums.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border/50 bg-muted/5">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-sm text-muted-foreground mb-4">{searchQuery || filterStatus !== 'all' ? 'No albums match your filters' : (t('admin.no_albums') || 'No albums yet')}</p>
            {!searchQuery && filterStatus === 'all' && (
              <button onClick={handleCreateAlbum} className="inline-flex items-center gap-2 px-4 py-2 border border-border text-xs font-medium hover:bg-muted transition-colors">
                <Plus className="w-4 h-4" />
                {t('admin.create_first_album') || 'Create your first album'}
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAlbums.map(album => (
              <div
                key={album.id}
                draggable
                onDragStart={e => handleDragStart(e, album.id)}
                onDragOver={e => handleDragOver(e, album.id)}
                onDragEnd={handleDragEnd}
                onClick={() => { setCurrentAlbum({ ...album }); setActiveTab('photos') }}
                className={`group cursor-pointer bg-card border border-border/50 hover:border-border transition-all ${draggingId === album.id ? 'opacity-50' : ''}`}
              >
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  <div className="absolute top-2 left-2 z-10 p-1 bg-black/40 text-white/70 hover:text-white cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <GripVertical className="w-4 h-4" />
                  </div>
                  {album.coverUrl || album.photos.length > 0 ? (
                    <img src={resolveAssetUrl(album.coverUrl || album.photos[0]?.thumbnailUrl || album.photos[0]?.url, cdnDomain)} alt={album.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FolderOpen className="w-10 h-10 opacity-10" /></div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 text-white text-[10px] font-medium">{album.photoCount}</div>
                  <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => handleTogglePublish(album, e)} className="p-1.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors">
                      {album.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={e => handleDeleteAlbum(album.id, e)} className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-medium truncate">{album.name}</h3>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${album.isPublished ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                  </div>
                  {album.description && <p className="text-xs text-muted-foreground line-clamp-1">{album.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAlbums.map(album => (
              <div
                key={album.id}
                draggable
                onDragStart={e => handleDragStart(e, album.id)}
                onDragOver={e => handleDragOver(e, album.id)}
                onDragEnd={handleDragEnd}
                onClick={() => { setCurrentAlbum({ ...album }); setActiveTab('photos') }}
                className={`group flex items-center gap-4 p-4 bg-card border border-border/50 hover:border-border cursor-pointer transition-all ${draggingId === album.id ? 'opacity-50' : ''}`}
              >
                <div className="text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab" onClick={e => e.stopPropagation()}>
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="w-16 h-12 bg-muted overflow-hidden flex-shrink-0">
                  {album.coverUrl || album.photos.length > 0 ? (
                    <img src={resolveAssetUrl(album.coverUrl || album.photos[0]?.thumbnailUrl || album.photos[0]?.url, cdnDomain)} alt={album.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FolderOpen className="w-5 h-5 opacity-20" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{album.name}</h3>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${album.isPublished ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">{album.photoCount} photos</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => handleTogglePublish(album, e)} className="p-2 hover:bg-muted transition-colors">
                    {album.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <button onClick={e => handleDeleteAlbum(album.id, e)} className="p-2 text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Detail View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentAlbum(null)} className="p-2 hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-medium">{currentAlbum.name || (t('admin.new_album') || 'New Album')}</h2>
            <p className="text-xs text-muted-foreground">{currentAlbum.isPublished ? t('admin.published') : t('admin.draft')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'overview' && (
            <button onClick={handleSaveAlbum} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-foreground text-background text-xs font-medium hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />
              {saving ? t('common.loading') : t('admin.save')}
            </button>
          )}
          {activeTab === 'photos' && (
            <button onClick={() => setShowPhotoSelector(true)} className="flex items-center gap-2 px-5 py-2 bg-foreground text-background text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
              <Plus className="w-4 h-4" />
              {t('admin.add_photos') || 'Add Photos'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          <Settings className="w-4 h-4" />
          {t('admin.overview') || 'Overview'}
        </button>
        {currentAlbum.id && (
          <button onClick={() => setActiveTab('photos')} className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === 'photos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <Layout className="w-4 h-4" />
            {t('admin.photos') || 'Photos'}
            <span className="ml-1 px-1.5 py-0.5 bg-muted text-[10px]">{currentAlbum.photos.length}</span>
          </button>
        )}
      </div>

      <div className="pt-2">
        {activeTab === 'overview' ? (
          <div className="max-w-xl space-y-6">
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t('admin.album_name') || 'Album Name'}</label>
              <CustomInput variant="config" value={currentAlbum.name} onChange={e => setCurrentAlbum({ ...currentAlbum, name: e.target.value })} placeholder={t('admin.album_name_placeholder') || 'Enter album name'} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-2">{t('admin.description') || 'Description'}</label>
              <textarea value={currentAlbum.description || ''} onChange={e => setCurrentAlbum({ ...currentAlbum, description: e.target.value })} placeholder={t('admin.description_placeholder') || 'Enter description (optional)'} className="w-full p-3 h-24 bg-muted/30 border-b border-border focus:border-primary outline-none text-sm transition-colors resize-none" />
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 border-b border-border">
              <input type="checkbox" checked={currentAlbum.isPublished} onChange={e => setCurrentAlbum({ ...currentAlbum, isPublished: e.target.checked })} className="w-4 h-4 accent-primary" />
              <span className="text-sm">{currentAlbum.isPublished ? t('admin.published') : t('admin.draft')}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {showPhotoSelector ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setShowPhotoSelector(false); setSelectedPhotoIds(new Set()) }} className="p-1.5 hover:bg-muted transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    <span className="text-sm">{selectedPhotoIds.size} selected</span>
                  </div>
                  <button onClick={handleAddPhotos} disabled={selectedPhotoIds.size === 0 || saving} className="flex items-center gap-2 px-4 py-1.5 bg-foreground text-background text-xs font-medium disabled:opacity-50 transition-colors">
                    <Check className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {availablePhotos.map(photo => {
                    const isSelected = selectedPhotoIds.has(photo.id)
                    return (
                      <div key={photo.id} onClick={() => setSelectedPhotoIds(prev => { const next = new Set(prev); next.has(photo.id) ? next.delete(photo.id) : next.add(photo.id); return next })} className={`relative aspect-square cursor-pointer ${isSelected ? 'ring-2 ring-primary' : 'hover:opacity-80'}`}>
                        <img src={resolveAssetUrl(photo.thumbnailUrl || photo.url, cdnDomain)} alt={photo.title} className="w-full h-full object-cover" />
                        {isSelected && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center"><Check className="w-5 h-5 text-primary" /></div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : currentAlbum.photos.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border/50 bg-muted/5">
                <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-10" />
                <p className="text-sm text-muted-foreground mb-3">{t('admin.album_empty') || 'This album is empty'}</p>
                <button onClick={() => setShowPhotoSelector(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-border text-xs font-medium hover:bg-muted transition-colors">
                  <Plus className="w-4 h-4" />
                  {t('admin.add_photos') || 'Add Photos'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {currentAlbum.photos.map(photo => {
                  const isCover = currentAlbum.coverUrl === (photo.thumbnailUrl || photo.url)
                  return (
                    <div key={photo.id} className="relative aspect-square group bg-muted overflow-hidden">
                      <img src={resolveAssetUrl(photo.thumbnailUrl || photo.url, cdnDomain)} alt={photo.title} className="w-full h-full object-cover" />
                      {isCover && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-medium">Cover</div>}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                        {!isCover && <button onClick={() => handleSetCover(photo.id)} className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-[9px] font-medium">Set Cover</button>}
                        <button onClick={() => handleRemovePhoto(photo.id)} className="px-2 py-1 bg-red-500/80 hover:bg-red-500 text-white text-[9px] font-medium">Remove</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}