'use client'

import React from 'react'
import {
  Plus,
  Image as ImageIcon,
  X,
  Loader2,
  Calendar,
  Upload,
  RefreshCw,
  MoreVertical,
} from 'lucide-react'
import { resolveAssetUrl, type StoryDto, type PhotoDto } from '@/lib/api'
import { AdminButton } from '@/components/admin/AdminButton'

export interface PendingImage {
  id: string
  file: File
  previewUrl: string
  status: 'pending' | 'uploading' | 'success' | 'failed'
  progress: number
  error?: string
  photoId?: string
  takenAt?: string
}

interface StoryPhotoPanelProps {
  currentStory: StoryDto | null
  pendingImages: PendingImage[]
  pendingCoverId: string | null
  cdnDomain?: string
  isUploading: boolean
  uploadProgress: { current: number; total: number; currentFile: string }
  isDraggingOver: boolean
  draggedItemId: string | null
  draggedItemType: 'photo' | 'pending' | null
  dragOverItemId: string | null
  openMenuPhotoId: string | null
  openMenuPendingId: string | null
  t: (key: string) => string
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
  onAddPhotos: () => void
  onRemovePhoto: (photoId: string) => void
  onRemovePendingImage: (id: string) => void
  onSetCover: (photoId: string) => void
  onSetPendingCover: (id: string) => void
  onSetPhotoDate: (takenAt: string) => void
  onRetryFailedUploads: () => void
  onPhotoPanelDragOver: (e: React.DragEvent) => void
  onPhotoPanelDragLeave: (e: React.DragEvent) => void
  onPhotoPanelDrop: (e: React.DragEvent) => void
  onItemDragStart: (e: React.DragEvent, itemId: string, type: 'photo' | 'pending') => void
  onItemDragEnd: (e: React.DragEvent) => void
  onItemDragOver: (e: React.DragEvent, itemId: string) => void
  onItemDragLeave: () => void
  onItemDrop: (e: React.DragEvent, targetId: string, targetType: 'photo' | 'pending') => void
  onOpenMenuPhoto: (photoId: string | null) => void
  onOpenMenuPending: (pendingId: string | null) => void
}

export function StoryPhotoPanel({
  currentStory,
  pendingImages,
  pendingCoverId,
  cdnDomain,
  isUploading,
  uploadProgress,
  isDraggingOver,
  draggedItemId,
  draggedItemType,
  dragOverItemId,
  openMenuPhotoId,
  openMenuPendingId,
  t,
  notify,
  onAddPhotos,
  onRemovePhoto,
  onRemovePendingImage,
  onSetCover,
  onSetPendingCover,
  onSetPhotoDate,
  onRetryFailedUploads,
  onPhotoPanelDragOver,
  onPhotoPanelDragLeave,
  onPhotoPanelDrop,
  onItemDragStart,
  onItemDragEnd,
  onItemDragOver,
  onItemDragLeave,
  onItemDrop,
  onOpenMenuPhoto,
  onOpenMenuPending,
}: StoryPhotoPanelProps) {
  // Build combined list for ordering: photos first, then pending
  const getCombinedItems = () => {
    const photoItems = (currentStory?.photos || []).map(p => ({ id: p.id, type: 'photo' as const }))
    const pendingItems = pendingImages.map(p => ({ id: p.id, type: 'pending' as const }))
    return [...photoItems, ...pendingItems]
  }

  return (
    <div
      className={`flex-[3] flex flex-col border rounded-lg overflow-hidden min-w-[320px] transition-colors ${isDraggingOver ? 'border-primary border-dashed bg-primary/5' : 'border-border bg-muted/20'}`}
      onDragOver={onPhotoPanelDragOver}
      onDragLeave={onPhotoPanelDragLeave}
      onDrop={onPhotoPanelDrop}
    >
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/50">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">{t('story.related_photos')}</span>
          <span className="text-xs text-muted-foreground">({(currentStory?.photos?.length || 0) + pendingImages.length})</span>
          {pendingImages.length > 0 && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-600 text-[10px] font-bold rounded">{pendingImages.length} 待上传</span>}
        </div>
        <AdminButton
          onClick={onAddPhotos}
          adminVariant="ghost"
          size="sm"
          className="flex items-center gap-1 text-primary font-medium hover:bg-primary/10 rounded-md"
        >
          <Plus className="w-3.5 h-3.5" /><span>{t('admin.add_photos')}</span>
        </AdminButton>
      </div>

      {isUploading && (
        <div className="px-4 py-2 bg-primary/5 border-b border-border">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground truncate max-w-[200px]">{uploadProgress.currentFile}</span>
            <span className="text-primary font-medium">{uploadProgress.current}/{uploadProgress.total}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {!isUploading && pendingImages.some(p => p.status === 'failed') && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center justify-between">
          <span className="text-xs text-destructive">{pendingImages.filter(p => p.status === 'failed').length} 张上传失败</span>
          <AdminButton
            onClick={onRetryFailedUploads}
            adminVariant="link"
            className="flex items-center gap-1 text-xs text-destructive"
          >
            <RefreshCw className="w-3 h-3" />重试
          </AdminButton>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {(currentStory?.photos && currentStory.photos.length > 0) || pendingImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {(() => {
              const combined = getCombinedItems()
              return combined.map((item, idx) => {
                if (item.type === 'photo') {
                  const photo = currentStory?.photos?.find(p => p.id === item.id)
                  if (!photo) return null
                  return (
                    <div key={photo.id} className="relative">
                      <div draggable onDragStart={(e) => onItemDragStart(e, photo.id, 'photo')} onDragEnd={onItemDragEnd} onDragOver={(e) => onItemDragOver(e, photo.id)} onDragLeave={onItemDragLeave} onDrop={(e) => onItemDrop(e, photo.id, 'photo')}
                        className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${dragOverItemId === photo.id ? 'border-primary border-dashed scale-105 shadow-lg' : currentStory?.coverPhotoId === photo.id ? 'border-primary' : 'border-transparent hover:border-border'} ${draggedItemId === photo.id && draggedItemType === 'photo' ? 'opacity-50' : ''}`}>
                        {/* Three-dot menu button */}
                        <AdminButton
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenMenuPhoto(openMenuPhotoId === photo.id ? null : photo.id)
                          }}
                          adminVariant="icon"
                          className="absolute top-1 right-1 z-20 p-1 bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 text-white"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </AdminButton>
                        <div className="absolute bottom-1 right-1 z-10 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"><span className="text-[10px] font-bold text-white">{idx + 1}</span></div>
                        <img src={resolveAssetUrl(photo.thumbnailUrl || photo.url, cdnDomain)} alt={photo.title} className="w-full h-full object-cover pointer-events-none" />
                        {currentStory?.coverPhotoId === photo.id && !pendingCoverId && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold uppercase rounded">{t('admin.cover')}</div>}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {(currentStory?.coverPhotoId !== photo.id || pendingCoverId) && (
                            <AdminButton
                              onClick={(e) => { e.stopPropagation(); onSetCover(photo.id) }}
                              adminVariant="ghost"
                              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded text-[10px] font-medium"
                            >
                              Cover
                            </AdminButton>
                          )}
                          <AdminButton
                            onClick={(e) => { e.stopPropagation(); onRemovePhoto(photo.id) }}
                            adminVariant="ghost"
                            className="p-1.5 bg-white/20 hover:bg-destructive text-white rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </AdminButton>
                        </div>
                      </div>
                      {/* Dropdown menu - outside the overflow-hidden container */}
                      {openMenuPhotoId === photo.id && (
                        <>
                          {/* Backdrop to close menu when clicking outside */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenMenuPhoto(null)
                            }}
                          />
                          <div className="absolute top-8 right-0 bg-background border border-border rounded-md shadow-lg py-1 min-w-[160px] z-50">
                            {photo.takenAt ? (
                              <AdminButton
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSetPhotoDate(photo.takenAt!)
                                  onOpenMenuPhoto(null)
                                  notify(t('admin.set_publish_time_success'), 'success')
                                }}
                                adminVariant="ghost"
                                className="w-full px-3 py-2 text-left text-xs hover:bg-muted flex items-center gap-2"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                {t('admin.set_as_publish_time')}
                              </AdminButton>
                            ) : (
                              <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                {t('admin.no_exif_time')}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                } else {
                  const pending = pendingImages.find(p => p.id === item.id)
                  if (!pending) return null
                  const isPendingCover = pendingCoverId === pending.id
                  return (
                    <div key={pending.id} className="relative">
                      <div draggable={pending.status !== 'uploading'} onDragStart={(e) => onItemDragStart(e, pending.id, 'pending')} onDragEnd={onItemDragEnd} onDragOver={(e) => onItemDragOver(e, pending.id)} onDragLeave={onItemDragLeave} onDrop={(e) => onItemDrop(e, pending.id, 'pending')}
                        className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${pending.status === 'uploading' ? 'border-primary border-solid' : pending.status === 'failed' ? 'border-destructive border-dashed' : isPendingCover ? 'border-primary border-solid' : 'border-amber-500 border-dashed'} ${dragOverItemId === pending.id ? 'scale-105 shadow-lg' : ''} ${draggedItemId === pending.id && draggedItemType === 'pending' ? 'opacity-50' : ''} ${pending.status !== 'uploading' ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                        {/* Three-dot menu button */}
                        {pending.status !== 'uploading' && (
                          <AdminButton
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenMenuPending(openMenuPendingId === pending.id ? null : pending.id)
                            }}
                            adminVariant="icon"
                            className="absolute top-1 right-1 z-20 p-1 bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 text-white"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </AdminButton>
                        )}
                        <div className="absolute bottom-1 right-1 z-10 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"><span className="text-[10px] font-bold text-white">{idx + 1}</span></div>
                        <img src={pending.previewUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
                        {isPendingCover && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold uppercase rounded">{t('admin.cover')}</div>}
                        {/* Status overlay - only show when not hovered or uploading */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${pending.status === 'uploading' ? 'bg-black/40 opacity-100' : pending.status === 'failed' ? 'bg-destructive/30 opacity-100' : 'bg-amber-500/20 opacity-100 group-hover:opacity-0'}`}>
                          {pending.status === 'uploading' && <div className="flex flex-col items-center"><Loader2 className="w-5 h-5 text-white animate-spin" /><span className="text-[10px] text-white mt-1">{pending.progress}%</span></div>}
                          {pending.status === 'pending' && <Upload className="w-5 h-5 text-amber-600" />}
                          {pending.status === 'failed' && <X className="w-5 h-5 text-destructive" />}
                        </div>
                        {/* Hover overlay with action buttons */}
                        {pending.status !== 'uploading' && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {!isPendingCover && (
                              <AdminButton
                                onClick={(e) => { e.stopPropagation(); onSetPendingCover(pending.id) }}
                                adminVariant="ghost"
                                className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded text-[10px] font-medium"
                              >
                                Cover
                              </AdminButton>
                            )}
                            <AdminButton
                              onClick={(e) => { e.stopPropagation(); onRemovePendingImage(pending.id) }}
                              adminVariant="ghost"
                              className="p-1.5 bg-white/20 hover:bg-destructive text-white rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </AdminButton>
                          </div>
                        )}
                      </div>
                      {/* Dropdown menu - outside the overflow-hidden container */}
                      {openMenuPendingId === pending.id && (
                        <>
                          {/* Backdrop to close menu when clicking outside */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenMenuPending(null)
                            }}
                          />
                          <div className="absolute top-8 right-0 bg-background border border-border rounded-md shadow-lg py-1 min-w-[160px] z-50">
                            {pending.takenAt ? (
                              <AdminButton
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSetPhotoDate(pending.takenAt!)
                                  onOpenMenuPending(null)
                                  notify(t('admin.set_publish_time_success'), 'success')
                                }}
                                adminVariant="ghost"
                                className="w-full px-3 py-2 text-left text-xs hover:bg-muted flex items-center gap-2"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                {t('admin.set_as_publish_time')}
                              </AdminButton>
                            ) : (
                              <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                {t('admin.no_exif_time')}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                }
              })
            })()}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Upload className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-xs text-center mb-1">拖拽图片到此处</p>
            <p className="text-[10px] text-center mb-3 opacity-60">或</p>
            <AdminButton onClick={onAddPhotos} adminVariant="link" className="text-xs text-primary">
              从图库选择
            </AdminButton>
          </div>
        )}
      </div>
    </div>
  )
}