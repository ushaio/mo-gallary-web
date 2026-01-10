'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Settings, Loader2 } from 'lucide-react'
import { getAdminAlbums, type AlbumDto } from '@/lib/api'
import { AdminButton } from '@/components/admin/AdminButton'

export interface UploadSettings {
  maxSizeMB?: number
  storageProvider?: string
  category?: string
  albumId?: string
}

interface ImageUploadSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (settings: UploadSettings) => void
  pendingCount: number
  t: (key: string) => string
  token: string | null
}

export function ImageUploadSettingsModal({
  isOpen,
  onClose,
  onConfirm,
  pendingCount,
  t,
  token,
}: ImageUploadSettingsModalProps) {
  const [maxSizeMB, setMaxSizeMB] = useState<string>('')
  const [storageProvider, setStorageProvider] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [albumId, setAlbumId] = useState<string>('')
  const [albums, setAlbums] = useState<AlbumDto[]>([])
  const [loadingAlbums, setLoadingAlbums] = useState(false)

  useEffect(() => {
    if (isOpen && token) {
      loadAlbums()
    }
  }, [isOpen, token])

  useEffect(() => {
    if (!isOpen) {
      setMaxSizeMB('')
      setStorageProvider('')
      setCategory('')
      setAlbumId('')
    }
  }, [isOpen])

  async function loadAlbums() {
    if (!token) return
    try {
      setLoadingAlbums(true)
      const data = await getAdminAlbums(token)
      setAlbums(data)
    } catch (err) {
      console.error('Failed to load albums:', err)
    } finally {
      setLoadingAlbums(false)
    }
  }

  function handleConfirm() {
    const settings: UploadSettings = {}
    if (maxSizeMB && parseFloat(maxSizeMB) > 0) {
      settings.maxSizeMB = parseFloat(maxSizeMB)
    }
    if (storageProvider) {
      settings.storageProvider = storageProvider
    }
    if (category.trim()) {
      settings.category = category.trim()
    }
    if (albumId) {
      settings.albumId = albumId
    }
    onConfirm(settings)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-background border border-border rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="font-bold">{t('admin.upload_settings') || '上传设置'}</h3>
          </div>
          <AdminButton
            onClick={onClose}
            adminVariant="icon"
            className="p-2 hover:bg-muted rounded-md"
          >
            <X className="w-4 h-4" />
          </AdminButton>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            {t('admin.upload_settings_hint') || `即将上传 ${pendingCount} 张图片，请设置上传参数（均为可选）：`}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t('admin.compression_size') || '压缩大小 (MB)'}
              </label>
              <input
                type="number"
                min="0.5"
                max="20"
                step="0.5"
                value={maxSizeMB}
                onChange={(e) => setMaxSizeMB(e.target.value)}
                placeholder={t('admin.optional') || '可选，不填则不压缩'}
                className="w-full p-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t('admin.storage_provider') || '存储源'}
              </label>
              <select
                value={storageProvider}
                onChange={(e) => setStorageProvider(e.target.value)}
                className="w-full p-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">{t('admin.use_default') || '使用默认'}</option>
                <option value="local">Local Storage</option>
                <option value="r2">Cloudflare R2</option>
                <option value="github">GitHub</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t('admin.category') || '分类'}
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t('admin.optional') || '可选'}
                className="w-full p-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t('admin.album') || '相册'}
              </label>
              <select
                value={albumId}
                onChange={(e) => setAlbumId(e.target.value)}
                disabled={loadingAlbums}
                className="w-full p-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
              >
                <option value="">{t('admin.none') || '不添加到相册'}</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>{album.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <AdminButton
            onClick={onClose}
            adminVariant="link"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {t('common.cancel') || '取消'}
          </AdminButton>
          <AdminButton
            onClick={handleConfirm}
            adminVariant="primary"
            size="md"
            className="flex items-center gap-2 rounded-md text-sm"
          >
            <Upload className="w-4 h-4" />
            {t('admin.start_upload') || '开始上传'}
          </AdminButton>
        </div>
      </div>
    </div>
  )
}