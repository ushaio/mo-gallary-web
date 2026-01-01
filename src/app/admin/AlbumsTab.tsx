'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  FolderOpen,
  Plus,
  Edit3,
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

  useEffect(() => {
    loadAlbums()
  }, [token])

  async function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(id)
  }

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) return

    const fromIndex = albums.findIndex((a) => a.id === draggingId)
    const toIndex = albums.findIndex((a) => a.id === targetId)

    if (fromIndex === -1 || toIndex === -1) return

    const newAlbums = [...albums]
    const [moved] = newAlbums.splice(fromIndex, 1)
    newAlbums.splice(toIndex, 0, moved)

    setAlbums(newAlbums)
  }

  async function handleDragEnd() {
    setDraggingId(null)
    if (!token) return

    // Update sort orders based on new index
    const updates = albums.map((album, index) => ({
      id: album.id,
      sortOrder: index,
    }))

    try {
      await reorderAlbums(token, updates)
    } catch (err) {
      console.error('Failed to reorder albums:', err)
      notify(t('common.error'), 'error')
      // Revert on error
      await loadAlbums()
    }
  }

  async function loadAlbums() {
    if (!token) return
    try {
      setLoading(true)
      const data = await getAdminAlbums(token)
      setAlbums(data)
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        onUnauthorized()
        return
      }
      console.error('Failed to load albums:', err)
      notify(t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleCreateAlbum() {
    const newAlbum: AlbumDto = {
      id: '',
      name: '',
      description: '',
      coverUrl: '',
      isPublished: false,
      sortOrder: albums.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos: [],
      photoCount: 0,
    }
    setCurrentAlbum(newAlbum)
    setActiveTab('overview')
  }

  function handleSelectAlbum(album: AlbumDto) {
    setCurrentAlbum({ ...album })
    setActiveTab('photos')
  }

  async function handleDeleteAlbum(id: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (!token) return
    if (!window.confirm(t('common.confirm') + '?')) return

    try {
      await deleteAlbum(token, id)
      notify(t('admin.notify_success'), 'success')
      if (currentAlbum?.id === id) {
        setCurrentAlbum(null)
      }
      await loadAlbums()
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        onUnauthorized()
        return
      }
      console.error('Failed to delete album:', err)
      notify(t('common.error'), 'error')
    }
  }

  async function handleSaveAlbum() {
    if (!token || !currentAlbum) return
    if (!currentAlbum.name.trim()) {
      notify(t('admin.album_name_required') || 'Please enter album name', 'error')
      return
    }

    try {
      setSaving(true)
      const isNew = !currentAlbum.id

      if (isNew) {
        const created = await createAlbum(token, {
          name: currentAlbum.name,
          description: currentAlbum.description || undefined,
          coverUrl: currentAlbum.coverUrl || undefined,
          isPublished: currentAlbum.isPublished,
          sortOrder: currentAlbum.sortOrder,
        })
        notify(t('admin.album_created') || 'Album created', 'success')
        setCurrentAlbum(created)
      } else {
        const updated = await updateAlbum(token, currentAlbum.id, {
          name: currentAlbum.name,
          description: currentAlbum.description || undefined,
          coverUrl: currentAlbum.coverUrl || undefined,
          isPublished: currentAlbum.isPublished,
          sortOrder: currentAlbum.sortOrder,
        })
        notify(t('admin.album_updated') || 'Album updated', 'success')
        setCurrentAlbum(updated)
      }
      await loadAlbums()
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        onUnauthorized()
        return
      }
      console.error('Failed to save album:', err)
      notify(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish(album: AlbumDto, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (!token) return

    try {
      const updated = await updateAlbum(token, album.id, {
        isPublished: !album.isPublished,
      })
      notify(t('admin.notify_success'), 'success')
      
      setAlbums(prev => prev.map(a => a.id === updated.id ? updated : a))
      if (currentAlbum?.id === updated.id) {
        setCurrentAlbum(updated)
      }
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        onUnauthorized()
        return
      }
      console.error('Failed to toggle publish:', err)
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
      if (err instanceof ApiUnauthorizedError) {
        onUnauthorized()
        return
      }
      console.error('Failed to add photos:', err)
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
      if (err instanceof ApiUnauthorizedError) {
        onUnauthorized()
        return
      }
      console.error('Failed to remove photo:', err)
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
      if (err instanceof ApiUnauthorizedError) {
        onUnauthorized()
        return
      }
      console.error('Failed to set cover:', err)
      notify(t('common.error'), 'error')
    }
  }

  // Get photos not in current album
  const availablePhotos = useMemo(() => {
    if (!currentAlbum) return photos
    const albumPhotoIds = new Set(currentAlbum.photos.map(p => p.id))
    return photos.filter(p => !albumPhotoIds.has(p.id))
  }, [photos, currentAlbum])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs font-mono uppercase">
        {t('common.loading')}
      </div>
    )
  }

  // List View
  if (!currentAlbum) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl">{t('admin.albums') || 'Albums'}</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
              {albums.length} {t('admin.total') || 'total'}
            </p>
          </div>
          <button
            onClick={handleCreateAlbum}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('admin.new_album') || 'New Album'}</span>
          </button>
        </div>

        {albums.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border/50 rounded-lg bg-muted/5">
            <FolderOpen className="w-12 h-12 mx-auto mb-6 opacity-10" />
            <p className="text-sm font-serif italic text-muted-foreground mb-6">
              {t('admin.no_albums') || 'No albums yet'}
            </p>
            <button
              onClick={handleCreateAlbum}
              className="inline-flex items-center gap-2 px-6 py-3 border border-border text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t('admin.create_first_album') || 'Create your first album'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {albums.map((album) => (
              <div
                key={album.id}
                draggable
                onDragStart={(e) => handleDragStart(e, album.id)}
                onDragOver={(e) => handleDragOver(e, album.id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleSelectAlbum(album)}
                className={`group cursor-pointer flex flex-col bg-card hover:shadow-lg transition-all duration-300 border border-border/50 ${
                  draggingId === album.id ? 'opacity-50' : ''
                }`}
              >
                {/* Cover */}
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {/* Drag Handle */}
                  <div
                    className="absolute top-2 left-2 z-10 p-1.5 bg-black/40 text-white/70 hover:text-white rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {album.coverUrl ? (
                    <img
                      src={resolveAssetUrl(album.coverUrl, cdnDomain)}
                      alt={album.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : album.photos.length > 0 ? (
                    <img
                      src={resolveAssetUrl(album.photos[0].thumbnailUrl || album.photos[0].url, cdnDomain)}
                      alt={album.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderOpen className="w-12 h-12 opacity-10" />
                    </div>
                  )}
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Photo Count Badge */}
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/40 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-widest border border-white/10">
                    {album.photoCount}
                  </div>

                  {/* Quick Actions (Hover) */}
                  <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button
                      onClick={(e) => handleTogglePublish(album, e)}
                      className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full transition-colors"
                      title={album.isPublished ? t('admin.unpublish') : t('admin.publish')}
                    >
                      {album.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => handleDeleteAlbum(album.id, e)}
                      className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                      title={t('admin.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-serif text-lg leading-tight truncate">
                      {album.name}
                    </h3>
                    <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${album.isPublished ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  </div>
                  
                  {album.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {album.description}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                    <span>{new Date(album.updatedAt).toLocaleString()}</span>
                    <span className="group-hover:text-primary transition-colors">Manage &rarr;</span>
                  </div>
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentAlbum(null)}
            className="p-2 hover:bg-muted transition-colors rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-serif text-2xl">{currentAlbum.name || (t('admin.new_album') || 'New Album')}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`w-2 h-2 rounded-full ${currentAlbum.isPublished ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                {currentAlbum.isPublished ? (t('admin.published') || 'Published') : (t('admin.draft') || 'Draft')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'overview' && (
            <button
              onClick={handleSaveAlbum}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? t('common.loading') : t('admin.save')}</span>
            </button>
          )}
          {activeTab === 'photos' && (
            <button
              onClick={() => setShowPhotoSelector(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t('admin.add_photos') || 'Add Photos'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-4 h-4" />
          {t('admin.overview') || 'Overview'}
        </button>
        {currentAlbum.id && (
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === 'photos'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layout className="w-4 h-4" />
            {t('admin.photos') || 'Photos'}
            <span className="ml-1 px-1.5 py-0.5 bg-muted text-[10px] rounded-full">
              {currentAlbum.photos.length}
            </span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="pt-4">
        {activeTab === 'overview' ? (
          <div className="max-w-2xl space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {t('admin.album_name') || 'Album Name'}
                </label>
                <CustomInput
                  variant="config"
                  value={currentAlbum.name}
                  onChange={(e) => setCurrentAlbum({ ...currentAlbum, name: e.target.value })}
                  placeholder={t('admin.album_name_placeholder') || 'Enter album name'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {t('admin.description') || 'Description'}
                </label>
                <textarea
                  value={currentAlbum.description || ''}
                  onChange={(e) => setCurrentAlbum({ ...currentAlbum, description: e.target.value })}
                  placeholder={t('admin.description_placeholder') || 'Enter description (optional)'}
                  className="w-full p-4 h-32 bg-transparent border border-border focus:border-primary outline-none text-sm transition-colors rounded-none resize-none font-serif placeholder:font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {t('admin.sort_order') || 'Sort Order'}
                  </label>
                  <CustomInput
                    variant="config"
                    type="number"
                    value={currentAlbum.sortOrder}
                    onChange={(e) => setCurrentAlbum({ ...currentAlbum, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {t('admin.status') || 'Status'}
                  </label>
                  <div className="flex items-center gap-3 p-3 border border-border bg-muted/5">
                    <input
                      type="checkbox"
                      checked={currentAlbum.isPublished}
                      onChange={(e) => setCurrentAlbum({ ...currentAlbum, isPublished: e.target.checked })}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                    <span className="text-xs uppercase tracking-wider">
                      {currentAlbum.isPublished ? (t('admin.published') || 'Published') : (t('admin.draft') || 'Draft')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {showPhotoSelector ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-4 bg-muted/10 border border-border">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setShowPhotoSelector(false)
                        setSelectedPhotoIds(new Set())
                      }}
                      className="p-2 hover:bg-muted transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wider">{t('admin.select_photos') || 'Select Photos'}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        {selectedPhotoIds.size} {t('admin.selected') || 'selected'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAddPhotos}
                    disabled={selectedPhotoIds.size === 0 || saving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('admin.confirm_add') || 'Confirm Add'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {availablePhotos.map((photo) => {
                    const isSelected = selectedPhotoIds.has(photo.id)
                    return (
                      <div
                        key={photo.id}
                        onClick={() => {
                          setSelectedPhotoIds(prev => {
                            const next = new Set(prev)
                            if (next.has(photo.id)) next.delete(photo.id)
                            else next.add(photo.id)
                            return next
                          })
                        }}
                        className={`relative aspect-square cursor-pointer group transition-all ${
                          isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:opacity-90'
                        }`}
                      >
                        <img
                          src={resolveAssetUrl(photo.thumbnailUrl || photo.url, cdnDomain)}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                              <Check className="w-5 h-5 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <>
                {currentAlbum.photos.length === 0 ? (
                  <div className="py-24 text-center border border-dashed border-border rounded-lg bg-muted/5">
                    <ImageIcon className="w-12 h-12 mx-auto mb-6 opacity-10" />
                    <p className="text-sm text-muted-foreground mb-6">
                      {t('admin.album_empty') || 'This album is empty'}
                    </p>
                    <button
                      onClick={() => setShowPhotoSelector(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 border border-border text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t('admin.add_photos') || 'Add Photos'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {currentAlbum.photos.map((photo) => {
                      const isCover = currentAlbum.coverUrl === (photo.thumbnailUrl || photo.url)
                      return (
                        <div
                          key={photo.id}
                          className="relative aspect-square group border border-border bg-muted overflow-hidden"
                        >
                          <img
                            src={resolveAssetUrl(photo.thumbnailUrl || photo.url, cdnDomain)}
                            alt={photo.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          
                          {isCover && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-[8px] font-bold uppercase tracking-wider shadow-sm">
                              {t('admin.cover') || 'Cover'}
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                            {!isCover && (
                              <button
                                onClick={() => handleSetCover(photo.id)}
                                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[9px] font-bold uppercase tracking-widest border border-white/20 backdrop-blur-sm transition-all"
                              >
                                {t('admin.set_cover') || 'Set Cover'}
                              </button>
                            )}
                            <button
                              onClick={() => handleRemovePhoto(photo.id)}
                              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/80 text-white text-[9px] font-bold uppercase tracking-widest border border-red-500/30 backdrop-blur-sm transition-all"
                            >
                              {t('admin.remove') || 'Remove'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}