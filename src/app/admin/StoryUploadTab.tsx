'use client'

import React, { useState, useRef, useMemo, useEffect } from 'react'
import {
  Upload,
  Save,
  Loader2,
  Check,
  X,
  Trash2,
  List as ListIcon,
  LayoutGrid,
  Plus,
  BookOpen,
  Edit3,
  ArrowRight,
  Minimize2,
} from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { AdminSettingsDto, uploadPhoto, createStory } from '@/lib/api'
import { formatFileSize } from '@/lib/utils'
import { CustomInput } from '@/components/ui/CustomInput'
import { useUploadQueue } from '@/contexts/UploadQueueContext'

interface StoryUploadFile {
  id: string
  file: File
  title: string
  previewUrl?: string
  status: 'pending' | 'uploading' | 'success' | 'failed'
  uploadedPhotoId?: string
}

interface StoryUploadTabProps {
  token: string | null
  categories: string[]
  settings: AdminSettingsDto | null
  t: (key: string) => string
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
  onStoryCreated: (storyId: string) => void
}

export function StoryUploadTab({
  token,
  categories,
  settings,
  t,
  notify,
  onStoryCreated,
}: StoryUploadTabProps) {
  const { addTasks } = useUploadQueue()

  // Story fields
  const [storyTitle, setStoryTitle] = useState('')
  const [storyDescription, setStoryDescription] = useState('')

  // Photo fields
  const [uploadFiles, setUploadFiles] = useState<StoryUploadFile[]>([])
  const [uploadViewMode, setUploadViewMode] = useState<'list' | 'grid'>('list')
  const [selectedUploadIds, setSelectedUploadIds] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)

  // Categories
  const [uploadCategories, setUploadCategories] = useState<string[]>([])
  const [categoryInput, setCategoryInput] = useState('')
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryContainerRef = useRef<HTMLDivElement>(null)

  // Batch title
  const [batchPhotoTitle, setBatchPhotoTitle] = useState('')

  // Storage config
  const [uploadSource, setUploadSource] = useState('local')
  const [isInitialized, setIsInitialized] = useState(false)
  const [uploadPath, setUploadPath] = useState('')

  // Upload state
  const [uploadError, setUploadError] = useState('')

  // Compression settings
  const [compressionEnabled, setCompressionEnabled] = useState(false)
  const [maxSizeMB, setMaxSizeMB] = useState(4)
  const [compressing, setCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState({ current: 0, total: 0 })

  // Initialize defaults from settings
  useEffect(() => {
    if (settings?.storage_provider && !isInitialized) {
      setUploadSource(settings.storage_provider)
      setIsInitialized(true)
    }
  }, [settings, isInitialized])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryContainerRef.current &&
        !categoryContainerRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
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
    setUploadCategories(uploadCategories.filter((c) => c !== cat))
  }

  // Generate preview for file
  const generatePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.src = url
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const maxSize = 120
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height
            height = maxSize
          }
        }
        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)
        const thumbUrl = canvas.toDataURL('image/webp', 0.8)
        URL.revokeObjectURL(url)
        resolve(thumbUrl)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve('')
      }
    })
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    )
    if (files.length > 0) {
      const newFiles: StoryUploadFile[] = await Promise.all(
        files.map(async (f) => {
          const previewUrl = await generatePreview(f)
          return {
            id: crypto.randomUUID(),
            file: f,
            title: f.name.replace(/\.[^/.]+$/, ''),
            previewUrl,
            status: 'pending' as const,
          }
        })
      )
      setUploadFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const newFiles: StoryUploadFile[] = await Promise.all(
        files.map(async (f) => {
          const previewUrl = await generatePreview(f)
          return {
            id: crypto.randomUUID(),
            file: f,
            title: f.name.replace(/\.[^/.]+$/, ''),
            previewUrl,
            status: 'pending' as const,
          }
        })
      )
      setUploadFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleUpload = async () => {
    if (!token) return
    if (uploadFiles.length === 0) {
      setUploadError(t('admin.select_files'))
      return
    }
    if (!storyTitle.trim()) {
      setUploadError(t('admin.story_title'))
      return
    }
    if (uploadCategories.length === 0) {
      setUploadError(t('admin.categories'))
      return
    }

    setUploadError('')

    // Filter only pending files
    let filesToUpload = uploadFiles.filter(f => f.status === 'pending')

    // Compress images if enabled
    if (compressionEnabled) {
      setCompressing(true)
      setCompressionProgress({ current: 0, total: filesToUpload.length })

      const compressedFiles: StoryUploadFile[] = []
      for (let i = 0; i < filesToUpload.length; i++) {
        const item = filesToUpload[i]
        try {
          // Only compress if file is larger than target size
          if (item.file.size > maxSizeMB * 1024 * 1024) {
            const compressedBlob = await imageCompression(item.file, {
              maxSizeMB: maxSizeMB,
              maxWidthOrHeight: 4096,
              useWebWorker: true,
              preserveExif: true,
            })
            // Ensure the compressed result is a File with the original name
            const compressedFile = new File(
              [compressedBlob],
              item.file.name,
              { type: compressedBlob.type, lastModified: Date.now() }
            )
            compressedFiles.push({ ...item, file: compressedFile })
          } else {
            compressedFiles.push(item)
          }
        } catch (err) {
          console.error(`Failed to compress ${item.file.name}:`, err)
          compressedFiles.push(item) // Use original if compression fails
        }
        setCompressionProgress({ current: i + 1, total: filesToUpload.length })
      }
      filesToUpload = compressedFiles
      setCompressing(false)
    }

    // First create the story (without photos)
    try {
      const story = await createStory(token, {
        title: storyTitle.trim(),
        content: storyDescription.trim() || '',
        isPublished: false,
        photoIds: [],
      })

      // Add tasks to the upload queue with storyId
      // The queue will handle the upload and associate photos with the story
      await addTasks({
        files: filesToUpload.map(item => ({ id: item.id, file: item.file })),
        title: batchPhotoTitle.trim() || '', // Will use filename if empty
        categories: uploadCategories,
        storageProvider: uploadSource || undefined,
        storagePath: uploadPath.trim() || undefined,
        storyId: story.id,
        albumIds: undefined,
        token,
      })

      // Clear the form
      setUploadFiles([])
      setSelectedUploadIds(new Set())
      setStoryTitle('')
      setStoryDescription('')

      notify(t('admin.upload_started'), 'info')

      // Navigate to story editor
      onStoryCreated(story.id)
    } catch (err) {
      console.error('Failed to create story:', err)
      setUploadError(err instanceof Error ? err.message : t('common.error'))
      notify(t('common.error'), 'error')
    }
  }

  const handleRemoveUpload = (id: string) => {
    setUploadFiles((prev) => prev.filter((item) => item.id !== id))
    setSelectedUploadIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleSelectUploadToggle = (id: string) => {
    setSelectedUploadIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAllUploads = () => {
    if (selectedUploadIds.size === uploadFiles.length) {
      setSelectedUploadIds(new Set())
    } else {
      setSelectedUploadIds(new Set(uploadFiles.map((f) => f.id)))
    }
  }

  const handleBulkRemoveUploads = () => {
    if (selectedUploadIds.size === 0) return
    setUploadFiles((prev) => prev.filter((item) => !selectedUploadIds.has(item.id)))
    setSelectedUploadIds(new Set())
  }

  const handleTitleChange = (id: string, title: string) => {
    setUploadFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, title } : f))
    )
  }

  const pendingCount = uploadFiles.filter(f => f.status === 'pending').length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Left Panel - Story Info */}
      <div className="lg:col-span-4 space-y-8">
        <div className="border border-border p-8 space-y-8 bg-card/50">
          <h3 className="font-serif text-xl font-light uppercase tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t('admin.upload_tab_story')}
          </h3>
          <div className="space-y-6">
            {/* Story Title */}
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {t('admin.story_title')} *
              </label>
              <CustomInput
                variant="config"
                type="text"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder="e.g., 春日漫步"
              />
            </div>

            {/* Story Description */}
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {t('admin.story_description')}
              </label>
              <textarea
                value={storyDescription}
                onChange={(e) => setStoryDescription(e.target.value)}
                rows={3}
                className="w-full p-3 bg-background border-b border-border focus:border-primary outline-none text-sm transition-colors rounded-none placeholder:text-muted-foreground/30 resize-none"
                placeholder={t('admin.story_description_hint')}
              />
            </div>

            {/* Categories */}
            <div ref={categoryContainerRef} className="relative">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {t('admin.categories')} *
              </label>
              <div
                className="min-h-12 p-2 bg-background border-b border-border flex flex-wrap gap-2 cursor-text items-center transition-colors focus-within:border-primary"
                onClick={() => {
                  setIsCategoryDropdownOpen(true)
                  categoryContainerRef.current?.querySelector('input')?.focus()
                }}
              >
                {uploadCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider"
                  >
                    {cat}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCategory(cat)
                      }}
                      className="hover:text-primary/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => {
                    setCategoryInput(e.target.value)
                    setIsCategoryDropdownOpen(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (categoryInput.trim()) addCategory(categoryInput)
                    } else if (
                      e.key === 'Backspace' &&
                      !categoryInput &&
                      uploadCategories.length > 0
                    ) {
                      removeCategory(uploadCategories[uploadCategories.length - 1])
                    }
                  }}
                  className="flex-1 min-w-[80px] outline-none bg-transparent text-sm font-mono"
                  placeholder={
                    uploadCategories.length === 0 ? t('admin.search_create') : ''
                  }
                />
              </div>
              {isCategoryDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border shadow-2xl max-h-48 overflow-y-auto">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={(e) => {
                          e.stopPropagation()
                          addCategory(cat)
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground flex items-center justify-between group transition-colors"
                      >
                        <span>{cat}</span>
                        <Check className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))
                  ) : categoryInput.trim() ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        addCategory(categoryInput)
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground text-primary flex items-center justify-between transition-colors"
                    >
                      <span>Create &ldquo;{categoryInput}&rdquo;</span>
                      <Plus className="w-3 h-3" />
                    </button>
                  ) : (
                    <div className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-widest text-center">
                      Start typing...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Batch Photo Title */}
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {t('admin.batch_photo_title')}
              </label>
              <CustomInput
                variant="config"
                type="text"
                value={batchPhotoTitle}
                onChange={(e) => setBatchPhotoTitle(e.target.value)}
                placeholder={t('admin.batch_photo_title_hint')}
              />
            </div>

            {/* Storage Config */}
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  {t('admin.storage_provider')}
                </label>
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
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  {t('admin.path_prefix')}
                </label>
                <CustomInput
                  variant="config"
                  type="text"
                  value={uploadPath}
                  onChange={(e) => setUploadPath(e.target.value)}
                  placeholder="e.g., 2025/stories"
                />
              </div>
            </div>

            {/* Image Compression */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <Minimize2 className="w-3 h-3" />
                  {t('admin.image_compression')}
                </label>
                <button
                  onClick={() => setCompressionEnabled(!compressionEnabled)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    compressionEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      compressionEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {compressionEnabled && (
                <div className="space-y-3">
                  <p className="text-[10px] text-muted-foreground">
                    {t('admin.compression_hint')}
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                      {t('admin.max_size_mb')}
                    </label>
                    <CustomInput
                      variant="config"
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={maxSizeMB}
                      onChange={(e) => setMaxSizeMB(parseFloat(e.target.value) || 4)}
                      className="w-20 text-center"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <div className="pt-4">
            <button
              onClick={handleUpload}
              disabled={compressing || pendingCount === 0}
              className="w-full py-4 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {compressing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {t('admin.compressing')} ({compressionProgress.current}/
                    {compressionProgress.total})
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('admin.create_story_upload')}</span>
                </>
              )}
            </button>
            {uploadError && (
              <p className="mt-4 text-[10px] text-destructive text-center font-bold uppercase tracking-widest">
                {uploadError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Upload Area */}
      <div className="lg:col-span-8 flex flex-col">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`h-[600px] border border-dashed transition-all flex flex-col relative ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/20'
          }`}
        >
          {uploadFiles.length > 0 ? (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 mr-2">
                    <input
                      type="checkbox"
                      checked={
                        uploadFiles.length > 0 &&
                        selectedUploadIds.size === uploadFiles.length
                      }
                      onChange={handleSelectAllUploads}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {selectedUploadIds.size > 0
                        ? `${selectedUploadIds.size} Selected`
                        : `${uploadFiles.length} ${t('admin.items')}`}
                    </span>
                  </div>
                  {selectedUploadIds.size > 0 && (
                    <button
                      onClick={handleBulkRemoveUploads}
                      className="p-1.5 text-destructive hover:bg-destructive/10 transition-colors rounded"
                      title="Delete Selected"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-muted p-1 border border-border">
                    <button
                      onClick={() => setUploadViewMode('list')}
                      className={`p-1.5 transition-all ${
                        uploadViewMode === 'list'
                          ? 'bg-background text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <ListIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setUploadViewMode('grid')}
                      className={`p-1.5 transition-all ${
                        uploadViewMode === 'grid'
                          ? 'bg-background text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setUploadFiles([])
                    }}
                    className="flex items-center gap-2 text-destructive hover:opacity-80 transition-opacity text-[10px] font-bold uppercase tracking-widest"
                  >
                    Clear
                  </button>
                  <div className="h-4 w-[1px] bg-border"></div>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest">
                    <Plus className="w-3.5 h-3.5" />
                    {t('admin.add_more')}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              </div>

              {/* File List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div
                  className={
                    uploadViewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                      : 'flex flex-col'
                  }
                >
                  {uploadFiles.map((item) => (
                    <StoryUploadFileItem
                      key={item.id}
                      item={item}
                      viewMode={uploadViewMode}
                      selected={selectedUploadIds.has(item.id)}
                      uploading={false}
                      onSelect={handleSelectUploadToggle}
                      onRemove={handleRemoveUpload}
                      onTitleChange={handleTitleChange}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <Upload className="w-16 h-16 mb-6 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-[0.2em] mb-4">
                {t('admin.drop_here')}
              </p>
              <p className="text-[10px] font-mono opacity-50 mb-8">
                {t('admin.support_types')}
              </p>
              <label className="px-8 py-3 border border-border hover:border-primary hover:text-primary transition-all cursor-pointer text-xs font-bold uppercase tracking-[0.2em]">
                {t('admin.select_files')}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// File item component with title editing
function StoryUploadFileItem({
  item,
  viewMode,
  selected,
  uploading,
  onSelect,
  onRemove,
  onTitleChange,
}: {
  item: StoryUploadFile
  viewMode: 'list' | 'grid'
  selected: boolean
  uploading: boolean
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onTitleChange: (id: string, title: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSaveTitle = () => {
    onTitleChange(item.id, editTitle.trim() || item.file.name.replace(/\.[^/.]+$/, ''))
    setIsEditing(false)
  }

  const statusIcon = () => {
    switch (item.status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />
      case 'failed':
        return <X className="w-4 h-4 text-destructive" />
      default:
        return null
    }
  }

  if (viewMode === 'grid') {
    return (
      <div
        className={`relative aspect-square border border-border transition-all group overflow-hidden ${
          item.status === 'uploading' ? 'ring-2 ring-primary' : ''
        } ${item.status === 'failed' ? 'ring-2 ring-destructive' : ''} ${
          selected ? 'border-primary bg-primary/5' : 'bg-background'
        }`}
      >
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt=""
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Upload className="w-6 h-6 text-muted-foreground/20" />
          </div>
        )}

        {/* Selection checkbox */}
        <div
          className={`absolute top-2 left-2 z-20 transition-opacity ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(item.id)}
            disabled={uploading}
            className="w-4 h-4 accent-primary cursor-pointer border-border bg-background"
          />
        </div>

        {/* Status overlay */}
        {item.status !== 'pending' && (
          <div
            className={`absolute inset-0 flex items-center justify-center z-20 ${
              item.status === 'success'
                ? 'bg-green-500/20'
                : item.status === 'failed'
                ? 'bg-destructive/20'
                : 'bg-background/40'
            }`}
          >
            {statusIcon()}
          </div>
        )}

        {/* Remove button */}
        {!uploading && item.status !== 'success' && (
          <button
            onClick={() => onRemove(item.id)}
            className="absolute top-2 right-2 p-1.5 bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all z-20"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Title at bottom */}
        <div className="absolute bottom-0 left-0 w-full p-2 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle()
                if (e.key === 'Escape') {
                  setEditTitle(item.title)
                  setIsEditing(false)
                }
              }}
              className="w-full bg-transparent border-b border-primary text-[10px] font-mono outline-none"
            />
          ) : (
            <div
              className="text-[10px] font-mono truncate cursor-pointer hover:text-primary flex items-center gap-1"
              onClick={() => !uploading && setIsEditing(true)}
            >
              <span className="truncate">{item.title}</span>
              <Edit3 className="w-2.5 h-2.5 flex-shrink-0 opacity-50" />
            </div>
          )}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div
      className={`flex items-center gap-4 p-3 border border-border mb-2 transition-colors ${
        item.status === 'uploading'
          ? 'bg-primary/5 border-primary/30'
          : item.status === 'failed'
          ? 'bg-destructive/5 border-destructive/30'
          : 'bg-background hover:bg-muted/30'
      } ${selected ? 'border-primary/50 bg-primary/5' : ''}`}
    >
      {/* Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(item.id)}
          disabled={uploading}
          className="w-4 h-4 accent-primary cursor-pointer"
        />
      </div>

      {/* Preview */}
      <div className="w-12 h-12 flex-shrink-0 bg-muted overflow-hidden border border-border">
        {item.previewUrl ? (
          <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Upload className="w-4 h-4 text-muted-foreground/20" />
          </div>
        )}
      </div>

      {/* Title (editable) */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle()
              if (e.key === 'Escape') {
                setEditTitle(item.title)
                setIsEditing(false)
              }
            }}
            className="w-full bg-transparent border-b border-primary text-xs font-bold uppercase tracking-wider outline-none"
          />
        ) : (
          <div
            className="flex items-center gap-2 cursor-pointer group/title"
            onClick={() => !uploading && setIsEditing(true)}
          >
            <p className="text-xs font-bold uppercase tracking-wider truncate text-foreground group-hover/title:text-primary transition-colors">
              {item.title}
            </p>
            <Edit3 className="w-3 h-3 text-muted-foreground opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        )}
        <p className="text-[10px] font-mono text-muted-foreground">
          {formatFileSize(item.file.size)}
        </p>
      </div>

      {/* Status / Actions */}
      <div className="flex items-center gap-3">
        {item.status === 'success' ? (
          <div className="flex items-center gap-1 text-green-500">
            <Check className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
              Done
            </span>
          </div>
        ) : item.status === 'uploading' ? (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline animate-pulse">
              Processing
            </span>
          </div>
        ) : item.status === 'failed' ? (
          <div className="flex items-center gap-1 text-destructive">
            <X className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
              Failed
            </span>
          </div>
        ) : uploading ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
            Waiting
          </span>
        ) : (
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
