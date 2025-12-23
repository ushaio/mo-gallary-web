'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import {
  Upload,
  Image as ImageIcon,
  Settings,
  LogOut,
  Plus,
  X,
  ChevronDown,
  Check,
  Globe,
  FolderTree,
  Cloud,
  MessageSquare,
  Search,
  Trash2,
  ExternalLink,
  Save,
  Menu,
  Ruler,
  HardDrive,
  Calendar,
  Maximize2,
  Star,
  Camera,
  Aperture,
  Clock,
  Gauge,
  MapPin,
  Code
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'
import ExifModal from '@/components/ExifModal'
import {
  ApiUnauthorizedError,
  deletePhoto,
  getAdminSettings,
  getCategories,
  getPhotos,
  resolveAssetUrl,
  updateAdminSettings,
  uploadPhoto,
  updatePhoto,
  type AdminSettingsDto,
  type PhotoDto,
} from '@/lib/api'

function AdminDashboard() {
  const { logout, token, user } = useAuth()
  const { settings: globalSettings, refresh: refreshGlobalSettings } = useSettings()
  const { t } = useLanguage()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('photos')
  const [settingsTab, setSettingsTab] = useState('site')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const siteTitle = globalSettings?.site_title || 'MO GALLERY'

  const [categories, setCategories] = useState<string[]>([])
  const [photos, setPhotos] = useState<PhotoDto[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [photosError, setPhotosError] = useState('')
  const [photoSearch, setPhotoSearch] = useState('')
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

  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadCategories, setUploadCategories] = useState<string[]>([])
  const [categoryInput, setCategoryInput] = useState('')
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryContainerRef = useRef<HTMLDivElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [uploadError, setUploadError] = useState('')

  const [settings, setSettings] = useState<AdminSettingsDto | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  const [uploadSource, setUploadSource] = useState('')
  const [uploadPath, setUploadPath] = useState('')

  const uploadPreviews = useMemo(() => {
    return uploadFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }))
  }, [uploadFiles])

  const resolvedCdnDomain = useMemo(() => settings?.cdn_domain?.trim() || undefined, [settings?.cdn_domain])

  const filteredPhotos = useMemo(() => {
    return photos.filter(p => 
      p.title.toLowerCase().includes(photoSearch.toLowerCase()) || 
      p.category.toLowerCase().includes(photoSearch.toLowerCase())
    )
  }, [photos, photoSearch])

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c !== '全部' && 
      c.toLowerCase().includes(categoryInput.toLowerCase()) && 
      !uploadCategories.includes(c)
    )
  }, [categories, categoryInput, uploadCategories])

  const addCategory = (cat: string) => {
    const trimmed = cat.trim()
    if (trimmed && !uploadCategories.includes(trimmed)) {
      setUploadCategories([...uploadCategories, trimmed])
    }
    setCategoryInput('')
  }

  const removeCategory = (cat: string) => {
    setUploadCategories(uploadCategories.filter(c => c !== cat))
  }

  const handleUnauthorized = () => {
    logout()
    router.push('/login')
  }

  const refreshCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
      if (uploadCategories.length === 0) {
        const first = data.find((c) => c && c !== '全部')
        if (first) setUploadCategories([first])
      }
    } catch {
      // optional
    }
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
      if (data.storage_provider) setUploadSource(data.storage_provider)
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
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      uploadPreviews.forEach(p => URL.revokeObjectURL(p.url))
    }
  }, [uploadPreviews])

  useEffect(() => {
    if (activeTab === 'photos') refreshPhotos()
    if (activeTab === 'settings') refreshSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token])

  const handleDelete = async (photoId: string) => {
    if (!token) return
    if (!window.confirm(t('common.confirm') + '?')) return
    try {
      await deletePhoto({ token, id: photoId })
      await refreshPhotos()
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setPhotosError(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const handleToggleFeatured = async (photo: PhotoDto) => {
    if (!token) return
    try {
      await updatePhoto({
        token,
        id: photo.id,
        patch: { isFeatured: !photo.isFeatured }
      })
      await refreshPhotos()
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setPhotosError(err instanceof Error ? err.message : t('common.error'))
    }
  }

  const handleUpload = async () => {
    if (!token) return
    if (uploadFiles.length === 0) {
      setUploadError(t('admin.select_files'))
      return
    }
    if (uploadFiles.length === 1 && !uploadTitle.trim()) {
      setUploadError(t('admin.photo_title'))
      return
    }
    if (uploadCategories.length === 0) {
      setUploadError(t('admin.categories'))
      return
    }

    setUploadError('')
    setUploading(true)
    setUploadProgress({ current: 0, total: uploadFiles.length })
    
    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        setUploadProgress(prev => ({ ...prev, current: i + 1 }))
        const file = uploadFiles[i]
        const title = uploadFiles.length === 1 ? uploadTitle.trim() : file.name.replace(/\.[^/.]+$/, "")
        
        await uploadPhoto({
          token,
          file: file,
          title: title,
          category: uploadCategories,
          storage_provider: uploadSource || undefined,
          storage_path: uploadPath.trim() || undefined,
        })
      }
      
      setUploadFiles([])
      setUploadTitle('')
      setUploadCategories([])
      setActiveTab('photos')
      await refreshPhotos()
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setUploadError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setUploading(false)
      setUploadProgress({ current: 0, total: 0 })
    }
  }

  const handleSaveSettings = async () => {
    if (!token || !settings) return
    setSettingsError('')
    setSettingsSaving(true)
    try {
      const updated = await updateAdminSettings(token, settings)
      setSettings(updated)
      // Refresh global settings after saving
      await refreshGlobalSettings()
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setSettingsError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      setUploadFiles(prev => [...prev, ...files])
    }
  }

  const sidebarItems = [
    { id: 'photos', label: t('admin.library'), icon: ImageIcon },
    { id: 'upload', label: t('admin.upload'), icon: Upload },
    { id: 'settings', label: t('admin.config'), icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar - Modern Design */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border transform transition-transform duration-300 md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-border">
            <h2 className="font-serif text-2xl font-bold tracking-tight">{siteTitle}</h2>
            <p className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              {t('admin.console')}
            </p>
          </div>

          <nav className="flex-1 p-6 space-y-2">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 text-xs font-bold tracking-widest uppercase transition-all
                  ${activeTab === item.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-border">
            <div className="flex items-center space-x-3 mb-6 px-2">
              <div className="w-8 h-8 bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold">
                {user?.username?.substring(0, 1).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate uppercase tracking-wider">{user?.username || 'ADMIN'}</p>
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">{t('admin.super_user')}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout()
                router.push('/')
              }}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 mr-4 md:hidden hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-serif text-2xl font-light tracking-tight uppercase">
                {activeTab === 'photos' && t('admin.library')}
                {activeTab === 'upload' && t('admin.upload')}
                {activeTab === 'settings' && t('admin.config')}
              </h1>
            </div>
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

        {/* Content Area */}
        <div className="p-8 flex-1">
          {activeTab === 'photos' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center space-x-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>{filteredPhotos.length} {t('admin.items')}</span>
                  <button className="hover:text-primary transition-colors flex items-center gap-2" onClick={refreshPhotos}>
                    <Globe className="w-3 h-3" /> {t('common.refresh')}
                  </button>
                </div>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('admin.add_new')}
                </button>
              </div>

              {photosError && (
                <div className="p-4 border border-destructive text-destructive text-xs tracking-widest uppercase flex items-center space-x-2">
                  <X className="w-4 h-4" />
                  <span>{photosError}</span>
                </div>
              )}

              {photosLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredPhotos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className="group relative cursor-pointer bg-muted"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      {/* Image Area */}
                      <div className="aspect-[4/5] overflow-hidden">
                        <img
                          src={resolveAssetUrl(photo.thumbnailUrl || photo.url, resolvedCdnDomain)}
                          alt={photo.title}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                          loading="lazy"
                        />
                      </div>

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      {/* Actions */}
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                         <button
                            onClick={(e) => { e.stopPropagation(); handleToggleFeatured(photo); }}
                            className={`p-2 bg-background/90 backdrop-blur-sm text-foreground hover:text-amber-500 transition-colors ${photo.isFeatured ? 'text-amber-500' : ''}`}
                            title="Toggle Featured"
                          >
                            <Star className={`w-4 h-4 ${photo.isFeatured ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                            className="p-2 bg-background/90 backdrop-blur-sm text-foreground hover:text-destructive transition-colors"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>

                      {/* Info Overlay */}
                       <div className="absolute bottom-0 left-0 w-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none">
                        <div className="bg-background/90 p-2 backdrop-blur-sm">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest truncate text-foreground">{photo.title}</h3>
                          <div className="flex gap-1 mt-1">
                            {photo.category.split(',').slice(0, 1).map(cat => (
                              <span key={cat} className="text-[8px] font-mono text-muted-foreground uppercase">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {photo.isFeatured && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest z-10">
                          {t('admin.feat')}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredPhotos.length === 0 && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border">
                      <ImageIcon className="w-12 h-12 mb-4 opacity-10" />
                      <p className="text-xs font-bold uppercase tracking-widest">{t('admin.no_photos')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-8">
                <div className="border border-border p-8 space-y-8 bg-card/50">
                  <h3 className="font-serif text-xl font-light uppercase tracking-tight flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    {t('admin.upload_params')}
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('admin.photo_title')}</label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        disabled={uploadFiles.length > 1}
                        className="w-full p-3 bg-background border-b border-border focus:border-primary outline-none text-sm transition-colors rounded-none placeholder:text-muted-foreground/30"
                        placeholder={uploadFiles.length > 1 ? t('admin.title_hint_multi') : t('admin.title_hint_single')}
                      />
                    </div>

                    <div ref={categoryContainerRef} className="relative">
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('admin.categories')}</label>
                      <div 
                        className="min-h-12 p-2 bg-background border-b border-border flex flex-wrap gap-2 cursor-text items-center transition-colors focus-within:border-primary"
                        onClick={() => {
                          setIsCategoryDropdownOpen(true)
                          categoryContainerRef.current?.querySelector('input')?.focus()
                        }}
                      >
                        {uploadCategories.map(cat => (
                          <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                            {cat}
                            <button onClick={(e) => { e.stopPropagation(); removeCategory(cat); }} className="hover:text-primary/70">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={categoryInput}
                          onChange={(e) => { setCategoryInput(e.target.value); setIsCategoryDropdownOpen(true); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); if (categoryInput.trim()) addCategory(categoryInput); }
                            else if (e.key === 'Backspace' && !categoryInput && uploadCategories.length > 0) removeCategory(uploadCategories[uploadCategories.length - 1]);
                          }}
                          className="flex-1 min-w-[80px] outline-none bg-transparent text-sm font-mono"
                          placeholder={uploadCategories.length === 0 ? t('admin.search_create') : ""}
                        />
                      </div>

                      {isCategoryDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-background border border-border shadow-2xl max-h-48 overflow-y-auto">
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map(cat => (
                              <button
                                key={cat}
                                onClick={(e) => { e.stopPropagation(); addCategory(cat); }}
                                className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground flex items-center justify-between group transition-colors"
                              >
                                <span>{cat}</span>
                                <Check className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                              </button>
                            ))
                          ) : categoryInput.trim() ? (
                            <button onClick={(e) => { e.stopPropagation(); addCategory(categoryInput); }} className="w-full text-left px-4 py-3 text-xs hover:bg-muted">
                              Create <span className="font-bold text-primary">&quot;{categoryInput}&quot;</span>
                            </button>
                          ) : (
                            <div className="px-4 py-3 text-center text-[10px] uppercase text-muted-foreground">No matches</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('admin.storage_provider')}</label>
                        <select
                          value={uploadSource}
                          onChange={(e) => setUploadSource(e.target.value)}
                          className="w-full p-3 bg-background border-b border-border focus:border-primary outline-none text-xs font-bold uppercase tracking-wider"
                        >
                          <option value="local">Local Storage</option>
                          <option value="r2">Cloudflare R2</option>
                          <option value="github">GitHub</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('admin.path_prefix')}</label>
                        <input
                          type="text"
                          value={uploadPath}
                          onChange={(e) => setUploadPath(e.target.value)}
                          className="w-full p-3 bg-background border-b border-border focus:border-primary outline-none text-sm font-mono transition-colors rounded-none placeholder:text-muted-foreground/30"
                          placeholder="e.g., 2025/vacation"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleUpload}
                      disabled={uploading || uploadFiles.length === 0}
                      className="w-full py-4 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t('admin.uploading')} ({uploadProgress.current}/{uploadProgress.total})</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{t('admin.start_upload')}</span>
                        </>
                      )}
                    </button>
                    {uploadError && <p className="mt-4 text-[10px] text-destructive text-center font-bold uppercase tracking-widest">{uploadError}</p>}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`
                    border border-dashed transition-all min-h-[600px] flex flex-col relative
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}
                  `}
                >
                  {uploadFiles.length > 0 ? (
                    <div className="flex-1 p-8 overflow-y-auto max-h-[700px]">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {uploadPreviews.map((preview, idx) => (
                          <div key={idx} className="relative aspect-square border border-border bg-muted group">
                            <img src={preview.url} alt="preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <button 
                              onClick={() => setUploadFiles(uploadFiles.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {uploading && uploadProgress.current > idx + 1 && (
                              <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                                <Check className="w-8 h-8 text-primary drop-shadow-md" />
                              </div>
                            )}
                            {uploading && uploadProgress.current === idx + 1 && (
                              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                              </div>
                            )}
                          </div>
                        ))}
                        {!uploading && (
                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
                              input.onchange = (e) => setUploadFiles(prev => [...prev, ...Array.from((e.target as HTMLInputElement).files ?? [])]);
                              input.click();
                            }}
                            className="aspect-square border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all group"
                          >
                            <Plus className="w-6 h-6 mb-2" />
                            <span className="text-[8px] font-bold uppercase tracking-widest">{t('admin.add_more')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                      <div className={`p-8 mb-6 transition-transform duration-500 ${isDragging ? 'scale-110' : ''}`}>
                        <Upload className={`w-12 h-12 stroke-1 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <h4 className="font-serif text-2xl mb-2">{t('admin.drop_here')}</h4>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">{t('admin.support_types')}</p>
                      <button 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
                          input.onchange = (e) => setUploadFiles(prev => [...prev, ...Array.from((e.target as HTMLInputElement).files ?? [])]);
                          input.click();
                        }}
                        className="px-8 py-3 bg-background border border-foreground text-foreground text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                      >
                        {t('admin.select_files')}
                      </button>
                    </div>
                  )}
                  {uploading && (
                    <div className="p-4 bg-background border-t border-border">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                        <span className="flex items-center space-x-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>{t('admin.processing')}</span>
                        </span>
                        <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-muted overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary" 
                          initial={{ width: 0 }}
                          animate={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-[1920px]">
              <div className="flex flex-col md:flex-row gap-12">
                {/* Settings Sidebar - Plain Text */}
                <aside className="w-full md:w-48 space-y-1">
                  <div className="mb-6 pb-2 border-b border-border">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('admin.config')}</h4>
                  </div>
                  {[
                    { id: 'site', label: t('admin.general'), icon: Globe },
                    { id: 'categories', label: t('admin.taxonomy'), icon: FolderTree },
                    { id: 'storage', label: t('admin.engine'), icon: Cloud },
                    { id: 'comments', label: t('admin.comments'), icon: MessageSquare },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id)}
                      className={`
                        w-full flex items-center justify-between px-2 py-3 text-xs font-bold uppercase tracking-widest transition-all border-l-2
                        ${settingsTab === tab.id ? 'border-primary text-primary pl-4' : 'border-transparent text-muted-foreground hover:text-foreground pl-2'}
                      `}
                    >
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </aside>

                {/* Settings Panel */}
                <div className="flex-1 min-h-[500px] flex flex-col">
                  {settingsError && (
                    <div className="mb-8 p-4 border border-destructive text-destructive text-xs tracking-widest uppercase flex items-center space-x-2">
                      <X className="w-4 h-4" />
                      <span>{settingsError}</span>
                    </div>
                  )}

                  {settingsLoading || !settings ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs font-mono uppercase">{t('common.loading')}</div>
                  ) : (
                    <div className="flex-1 space-y-12">
                      {settingsTab === 'site' && (
                        <div className="max-w-2xl space-y-8">
                          <div className="pb-4 border-b border-border">
                            <h3 className="font-serif text-2xl">{t('admin.general')}</h3>
                          </div>
                          <div className="space-y-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('admin.site_title')}</label>
                                <input
                                  type="text"
                                  value={settings.site_title}
                                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                                  className="w-full p-4 bg-transparent border border-border focus:border-primary outline-none text-sm transition-colors rounded-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('admin.cdn_host')}</label>
                                <input
                                  type="text"
                                  value={settings.cdn_domain}
                                  onChange={(e) => setSettings({ ...settings, cdn_domain: e.target.value })}
                                  placeholder="https://cdn.example.com"
                                  className="w-full p-4 bg-transparent border border-border focus:border-primary outline-none text-sm transition-colors rounded-none"
                                />
                                <p className="text-[10px] text-muted-foreground font-mono">Leave empty to use API host.</p>
                              </div>
                          </div>
                        </div>
                      )}

                      {settingsTab === 'categories' && (
                        <div className="space-y-8">
                          <div className="pb-4 border-b border-border">
                            <h3 className="font-serif text-2xl">{t('admin.taxonomy')}</h3>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {categories.map(cat => (
                              <div key={cat} className="flex items-center space-x-2 px-4 py-2 bg-muted border border-border text-xs font-bold uppercase tracking-wider group">
                                <span>{cat}</span>
                                {cat !== '全部' && (
                                  <button className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button className="flex items-center space-x-2 px-4 py-2 border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-all text-xs font-bold uppercase tracking-wider">
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('admin.add_new')}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {settingsTab === 'storage' && (
                        <div className="max-w-3xl space-y-8">
                          <div className="pb-4 border-b border-border">
                            <h3 className="font-serif text-2xl">{t('admin.engine')}</h3>
                          </div>
                          
                          <div className="space-y-8">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('admin.active_provider')}</label>
                              <div className="flex gap-4">
                                {['local', 'r2', 'github'].map(p => (
                                  <button
                                    key={p}
                                    onClick={() => setSettings({ ...settings, storage_provider: p })}
                                    className={`
                                      px-6 py-3 text-xs font-bold uppercase tracking-widest border transition-all
                                      ${settings.storage_provider === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'}
                                    `}
                                  >
                                    {p.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {settings.storage_provider === 'r2' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 border border-border bg-muted/20">
                                <div className="md:col-span-2 space-y-2">
                                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Endpoint</label>
                                  <input
                                    type="text"
                                    value={settings.r2_endpoint ?? ''}
                                    onChange={(e) => setSettings({ ...settings, r2_endpoint: e.target.value })}
                                    className="w-full p-3 bg-background border border-border focus:border-primary outline-none text-xs font-mono"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Access Key ID</label>
                                  <input
                                    type="text"
                                    value={settings.r2_access_key_id ?? ''}
                                    onChange={(e) => setSettings({ ...settings, r2_access_key_id: e.target.value })}
                                    className="w-full p-3 bg-background border border-border focus:border-primary outline-none text-xs font-mono"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Secret Access Key</label>
                                  <input
                                    type="password"
                                    value={settings.r2_secret_access_key ?? ''}
                                    onChange={(e) => setSettings({ ...settings, r2_secret_access_key: e.target.value })}
                                    className="w-full p-3 bg-background border border-border focus:border-primary outline-none text-xs font-mono"
                                  />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Bucket</label>
                                  <input
                                    type="text"
                                    value={settings.r2_bucket ?? ''}
                                    onChange={(e) => setSettings({ ...settings, r2_bucket: e.target.value })}
                                    className="w-full p-3 bg-background border border-border focus:border-primary outline-none text-xs font-mono"
                                  />
                                </div>
                              </div>
                            )}

                            {settings.storage_provider === 'github' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 border border-border bg-muted/20">
                                <div className="md:col-span-2 space-y-2">
                                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Personal Access Token</label>
                                  <input
                                    type="password"
                                    value={settings.github_token ?? ''}
                                    onChange={(e) => setSettings({ ...settings, github_token: e.target.value })}
                                    className="w-full p-3 bg-background border border-border focus:border-primary outline-none text-xs font-mono"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Repo (owner/repo)</label>
                                  <input
                                    type="text"
                                    value={settings.github_repo ?? ''}
                                    onChange={(e) => setSettings({ ...settings, github_repo: e.target.value })}
                                    className="w-full p-3 bg-background border border-border focus:border-primary outline-none text-xs font-mono"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Path</label>
                                  <input
                                    type="text"
                                    value={settings.github_path ?? ''}
                                    onChange={(e) => setSettings({ ...settings, github_path: e.target.value })}
                                    className="w-full p-3 bg-background border border-border focus:border-primary outline-none text-xs font-mono"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {settingsTab === 'comments' && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-24 border border-dashed border-border">
                          <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
                          <div className="text-center">
                            <h4 className="text-sm font-bold uppercase tracking-widest">{t('admin.comments')}</h4>
                            <p className="text-xs text-muted-foreground mt-2 font-mono">{t('admin.dev_progress')}</p>
                          </div>
                        </div>
                      )}

                      <div className="pt-8 border-t border-border flex justify-end">
                        <button
                          onClick={handleSaveSettings}
                          disabled={settingsSaving}
                          className="px-8 py-4 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all flex items-center space-x-2"
                        >
                          {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          <span>{t('admin.save')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal - Admin Preview */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8 bg-background/95 backdrop-blur-sm">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="relative w-full h-full max-w-[1800px] bg-background border border-border flex flex-col lg:flex-row overflow-hidden shadow-2xl"
                        >
                          <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-0 right-0 z-50 p-6 text-foreground hover:text-primary transition-colors bg-background/50 backdrop-blur-md border-b border-l border-border"
                          >
                            <X className="w-6 h-6" />
                          </button>
            
                          <div className="w-full lg:w-[70%] h-full flex items-center justify-center bg-black/5 relative overflow-hidden">
                            <div className="w-full h-full p-4 md:p-12 flex items-center justify-center">
                              <img 
                                src={resolveAssetUrl(selectedPhoto.url, resolvedCdnDomain)} 
                                alt={selectedPhoto.title}
                                className="max-w-full max-h-full object-contain shadow-2xl"
                              />
                            </div>
                          </div>
            
                          <div className="w-full lg:w-[30%] h-full flex flex-col border-l border-border bg-background overflow-y-auto">
                            <div className="p-8 md:p-12 space-y-12 flex-1">
                              {/* Header */}
                              <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                  {selectedPhoto.category.split(',').map(cat => (
                                    <span key={cat} className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary border border-primary px-2 py-1">
                                      {cat}
                                    </span>
                                  ))}
                                  {selectedPhoto.isFeatured && (
                                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                                      <Star className="w-3 h-3 fill-current" /> {t('admin.feat')}
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
                              {/* Metadata Card */}
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
                                    <p className="font-mono text-sm">{new Date(selectedPhoto.createdAt).toLocaleDateString()}</p>
                                  </div>
                              </div>
            
                              {/* Admin EXIF Details */}
                              {(selectedPhoto.cameraModel || selectedPhoto.aperture || selectedPhoto.iso) ? (
                                <div className="space-y-8 pt-8 border-t border-border">
                                  <div className="space-y-2">
                                     <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2">
                                       <Camera className="w-3 h-3" /> {t('gallery.equipment')}
                                     </p>
                                     <p className="font-serif text-xl">{selectedPhoto.cameraMake} {selectedPhoto.cameraModel}</p>
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

                                    {selectedPhoto.latitude && selectedPhoto.longitude && (
                                      <button 
                                        onClick={() => window.open(`https://www.google.com/maps?q=${selectedPhoto.latitude},${selectedPhoto.longitude}`, '_blank')}
                                        className="mt-4 w-full py-3 bg-muted hover:bg-muted/80 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                                      >
                                        <MapPin className="w-3 h-3" /> View on Map
                                      </button>
                                    )}
                                </div>
                              ) : (
                                <div className="pt-8 border-t border-border opacity-50">
                                  <p className="text-[10px] tracking-[0.2em] uppercase">{t('gallery.no_exif')}</p>
                                </div>
                              )}
                            </div>
                <div className="p-6 border-t border-border bg-muted/10">
                  <button 
                    onClick={() => window.open(resolveAssetUrl(selectedPhoto.url, resolvedCdnDomain), '_blank')}
                    className="w-full py-4 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                    {t('gallery.download')}
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

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  )
}