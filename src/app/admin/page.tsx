'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Upload as UploadIcon,
  Image as ImageIcon,
  Settings,
  BookText,
  Menu,
  ExternalLink,
  Search,
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'
import {
  ApiUnauthorizedError,
  deletePhoto,
  getAdminSettings,
  getCategories,
  getPhotos,
  updateAdminSettings,
  updatePhoto,
  type AdminSettingsDto,
  type PhotoDto,
} from '@/lib/api'

import { Toast, type Notification } from '@/components/admin/Toast'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { PhotosTab } from './PhotosTab'
import { UploadTab } from './UploadTab'
import { LogsTab } from './LogsTab'
import { SettingsTab } from './SettingsTab'
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog'
import { PhotoDetailModal } from '@/components/PhotoDetailModal'

function AdminDashboard() {
  const { logout, token, user } = useAuth()
  const { settings: globalSettings, refresh: refreshGlobalSettings } = useSettings()
  const { t } = useLanguage()
  const router = useRouter()

  // Navigation State
  const [activeTab, setActiveTab] = useState('photos')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 4000)
  }

  // Photos State
  const [categories, setCategories] = useState<string[]>([])
  const [photos, setPhotos] = useState<PhotoDto[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [photosError, setPhotosError] = useState('')
  const [photosViewMode, setPhotosViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set())
  const [photoSearch, setPhotoSearch] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoDto | null>(null)

  // Delete Dialog State
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    photoIds: string[]
    isBulk: boolean
  } | null>(null)
  const [deleteFromStorage, setDeleteFromStorage] = useState(true)

  // Settings State
  const [settings, setSettings] = useState<AdminSettingsDto | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  const siteTitle = globalSettings?.site_title || 'MO GALLERY'

  const handleUnauthorized = () => {
    logout()
    router.push('/login')
  }

  // --- Data Fetching ---

  const refreshCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch { }
  }

  const refreshPhotos = async () => {
    setPhotosError('')
    setPhotosLoading(true)
    try {
      const data = await getPhotos()
      setPhotos(data)
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setPhotosError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setPhotosLoading(false)
    }
  }

  const refreshSettings = async () => {
    if (!token) return
    setSettingsError('')
    setSettingsLoading(true)
    try {
      const data = await getAdminSettings(token)
      setSettings(data)
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setSettingsError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    refreshCategories()
  }, [])

  useEffect(() => {
    if (activeTab === 'photos' || activeTab === 'logs') refreshPhotos()
    if (activeTab === 'settings' || activeTab === 'upload') refreshSettings()
  }, [activeTab, token]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Photos Handlers ---

  const filteredPhotos = useMemo(() => {
    return photos.filter(
      (p) =>
        p.title.toLowerCase().includes(photoSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(photoSearch.toLowerCase())
    )
  }, [photos, photoSearch])

  const handleDelete = async (photoId?: string) => {
    if (!token) return
    if (photoId) {
      setDeleteConfirmDialog({ photoIds: [photoId], isBulk: false })
    } else if (selectedPhotoIds.size > 0) {
      setDeleteConfirmDialog({
        photoIds: Array.from(selectedPhotoIds),
        isBulk: true,
      })
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirmDialog || !token) return

    try {
      if (deleteConfirmDialog.isBulk) {
        setPhotosLoading(true)
        for (const id of deleteConfirmDialog.photoIds) {
          await deletePhoto({ token, id, deleteFromStorage })
        }
        setSelectedPhotoIds(new Set())
      } else {
        await deletePhoto({
          token,
          id: deleteConfirmDialog.photoIds[0],
          deleteFromStorage,
        })
      }
      await refreshPhotos()
      notify(t('admin.notify_photo_deleted'))
      setDeleteConfirmDialog(null)
      setDeleteFromStorage(true)
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      notify(err instanceof Error ? err.message : t('common.error'), 'error')
    } finally {
      setPhotosLoading(false)
    }
  }

  const handleToggleFeatured = async (photo: PhotoDto) => {
    if (!token) return
    try {
      await updatePhoto({
        token,
        id: photo.id,
        patch: { isFeatured: !photo.isFeatured },
      })
      await refreshPhotos()
      notify(
        photo.isFeatured
          ? t('admin.notify_featured_removed')
          : t('admin.notify_featured_added')
      )
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      notify(err instanceof Error ? err.message : t('common.error'), 'error')
    }
  }

  const handleSelectPhotoToggle = (id: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAllPhotos = () => {
    if (selectedPhotoIds.size === filteredPhotos.length) {
      setSelectedPhotoIds(new Set())
    } else {
      setSelectedPhotoIds(new Set(filteredPhotos.map((p) => p.id)))
    }
  }

  // --- Settings Handlers ---

  const handleSaveSettings = async () => {
    if (!token || !settings) return
    setSettingsError('')
    setSettingsSaving(true)
    try {
      const updated = await updateAdminSettings(token, settings)
      setSettings(updated)
      await refreshGlobalSettings()
      notify(t('admin.notify_config_saved'))
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setSettingsError(err instanceof Error ? err.message : t('common.error'))
      notify('Failed to save settings', 'error')
    } finally {
      setSettingsSaving(false)
    }
  }

  // --- Sidebar Items ---
  const sidebarItems = [
    { id: 'photos', label: t('admin.library'), icon: ImageIcon },
    { id: 'upload', label: t('admin.upload'), icon: UploadIcon },
    { id: 'logs', label: t('admin.logs'), icon: BookText },
    { id: 'settings', label: t('admin.config'), icon: Settings },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Toast
        notifications={notifications}
        remove={(id) =>
          setNotifications((prev) => prev.filter((n) => n.id !== id))
        }
      />

      <AdminSidebar
        siteTitle={siteTitle}
        isMobileMenuOpen={isMobileMenuOpen}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setIsMobileMenuOpen(false)
        }}
        user={user}
        onLogout={() => {
          logout()
          router.push('/')
        }}
        t={t}
        items={sidebarItems}
      />

      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-between px-8 py-4 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 mr-4 md:hidden hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-serif text-2xl font-light tracking-tight uppercase">
              {activeTab === 'photos' && t('admin.library')}
              {activeTab === 'upload' && t('admin.upload')}
              {activeTab === 'logs' && t('admin.logs')}
              {activeTab === 'settings' && t('admin.config')}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {activeTab === 'photos' && (
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={photoSearch}
                  onChange={(e) => setPhotoSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-muted border-none text-xs font-mono focus:ring-1 focus:ring-primary w-64 transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            )}
            <button
              onClick={() => router.push('/gallery')}
              className="flex items-center gap-2 px-3 py-1.5 border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-xs font-bold uppercase tracking-widest"
            >
              <span>{t('admin.view_site')}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'photos' && (
            <PhotosTab
              photos={filteredPhotos}
              loading={photosLoading}
              error={photosError}
              viewMode={photosViewMode}
              selectedIds={selectedPhotoIds}
              onViewModeChange={setPhotosViewMode}
              onSelect={handleSelectPhotoToggle}
              onSelectAll={handleSelectAllPhotos}
              onDelete={handleDelete}
              onRefresh={refreshPhotos}
              onToggleFeatured={handleToggleFeatured}
              onAdd={() => setActiveTab('upload')}
              onPreview={setSelectedPhoto}
              t={t}
              settings={settings}
            />
          )}

          {activeTab === 'upload' && (
            <UploadTab
              token={token}
              categories={categories}
              settings={settings}
              t={t}
              notify={notify}
              onUploadSuccess={() => {
                setActiveTab('photos')
                refreshPhotos()
              }}
              onPreview={(item) => {
                // If we need a preview modal for upload, we can reuse logic or implement here.
                // AdminDashboard previously had preview logic for upload.
                // For simplicity, let's just log or ignore if not critical, or implement simple preview.
                // Wait, UploadFileItem has onPreview.
                // I'll skip implementation for now to save space, or open image in new tab?
                // Or better, add a simple preview state in UploadTab.
                // I passed `onPreview` to UploadTab but didn't implement logic in AdminDashboard.
                // UploadTab can handle its own preview state if it's just for that tab.
                // But wait, `UploadTab` prop was `onPreview: (file) => void`.
                // I should probably let UploadTab handle it.
                // I'll modify UploadTab to handle preview internally if possible, or pass handler.
                // Let's pass a handler that opens a simple modal or window.
                const url = URL.createObjectURL(item.file)
                window.open(url, '_blank')
              }}
            />
          )}

          {activeTab === 'logs' && (
            <LogsTab
              photos={photos}
              settings={settings}
              t={t}
              notify={notify}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              token={token}
              settings={settings}
              setSettings={setSettings}
              categories={categories}
              loading={settingsLoading}
              saving={settingsSaving}
              error={settingsError}
              onSave={handleSaveSettings}
              t={t}
              notify={notify}
              onUnauthorized={handleUnauthorized}
            />
          )}
        </div>
      </main>

      <PhotoDetailModal
        photo={selectedPhoto}
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteConfirmDialog}
        isBulk={deleteConfirmDialog?.isBulk ?? false}
        count={deleteConfirmDialog?.photoIds.length ?? 0}
        deleteFromStorage={deleteFromStorage}
        setDeleteFromStorage={setDeleteFromStorage}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmDialog(null)
          setDeleteFromStorage(true)
        }}
        t={t}
      />
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  )
}