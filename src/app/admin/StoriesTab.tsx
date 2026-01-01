'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  History,
  FileText,
  Edit3,
  Trash2,
  ChevronLeft,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  getAdminStories,
  createStory,
  updateStory,
  deleteStory,
  type StoryDto,
} from '@/lib/api'
import { CustomInput } from '@/components/ui/CustomInput'

interface StoriesTabProps {
  token: string | null
  t: (key: string) => string
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
  editStoryId?: string
}

export function StoriesTab({ token, t, notify, editStoryId }: StoriesTabProps) {
  const [stories, setStories] = useState<StoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStory, setCurrentStory] = useState<StoryDto | null>(null)
  const [storyEditMode, setStoryEditMode] = useState<'list' | 'editor'>('list')
  const [storyPreviewActive, setStoryPreviewActive] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadStories()
  }, [token])

  // Handle editStoryId - auto-open editor for the specified story
  useEffect(() => {
    if (editStoryId && stories.length > 0) {
      const storyToEdit = stories.find(s => s.id === editStoryId)
      if (storyToEdit) {
        setCurrentStory({ ...storyToEdit })
        setStoryEditMode('editor')
        setStoryPreviewActive(false)
      }
    }
  }, [editStoryId, stories])

  async function loadStories() {
    if (!token) return
    try {
      setLoading(true)
      const data = await getAdminStories(token)
      setStories(data)
    } catch (err) {
      console.error('Failed to load stories:', err)
      notify(t('story.load_failed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleCreateStory() {
    setCurrentStory({
      id: crypto.randomUUID(),
      title: '',
      content: '',
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos: [],
    })
    setStoryEditMode('editor')
    setStoryPreviewActive(false)
  }

  function handleEditStory(story: StoryDto) {
    setCurrentStory({ ...story })
    setStoryEditMode('editor')
    setStoryPreviewActive(false)
  }

  async function handleDeleteStory(id: string) {
    if (!token) return
    if (!window.confirm(t('common.confirm') + '?')) return

    try {
      await deleteStory(token, id)
      notify(t('story.deleted'), 'success')
      await loadStories()
    } catch (err) {
      console.error('Failed to delete story:', err)
      notify(t('story.delete_failed'), 'error')
    }
  }

  async function handleSaveStory() {
    if (!token || !currentStory) return
    if (!currentStory.title.trim() || !currentStory.content.trim()) {
      notify(t('story.fill_title_content'), 'error')
      return
    }

    try {
      setSaving(true)
      const isNew = !stories.find((s) => s.id === currentStory.id)

      if (isNew) {
        await createStory(token, {
          title: currentStory.title,
          content: currentStory.content,
          isPublished: currentStory.isPublished,
          photoIds: [],
        })
        notify(t('story.created'), 'success')
      } else {
        await updateStory(token, currentStory.id, {
          title: currentStory.title,
          content: currentStory.content,
          isPublished: currentStory.isPublished,
        })
        notify(t('story.updated'), 'success')
      }

      setStoryEditMode('list')
      setCurrentStory(null)
      await loadStories()
    } catch (err) {
      console.error('Failed to save story:', err)
      notify(t('story.save_failed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish(story: StoryDto) {
    if (!token) return

    try {
      await updateStory(token, story.id, {
        isPublished: !story.isPublished,
      })
      notify(story.isPublished ? t('story.unpublished') : t('story.published'), 'success')
      await loadStories()
    } catch (err) {
      console.error('Failed to toggle publish:', err)
      notify(t('story.operation_failed'), 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      {storyEditMode === 'list' ? (
        <div className="space-y-8 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <BookOpen className="w-6 h-6 text-primary" />
              <h3 className="font-serif text-2xl uppercase tracking-tight">
                {t('ui.photo_story')}
              </h3>
            </div>
            <button
              onClick={handleCreateStory}
              className="flex items-center px-6 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('ui.create_story')}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 gap-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="flex items-center justify-between p-6 border border-border hover:border-primary transition-all group"
                >
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => handleEditStory(story)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-serif text-xl group-hover:text-primary transition-colors">
                        {story.title || t('story.untitled')}
                      </h4>
                      <span
                        className={`text-[8px] font-black uppercase px-1.5 py-0.5 border ${
                          story.isPublished
                            ? 'border-primary text-primary'
                            : 'border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        {story.isPublished ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono uppercase">
                      <span className="flex items-center gap-1">
                        <History className="w-3 h-3" />{' '}
                        {new Date(story.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {story.content.length}{' '}
                        {t('admin.characters')}
                      </span>
                      {story.photos && story.photos.length > 0 && (
                        <span className="flex items-center gap-1">
                          📷 {story.photos.length} {t('ui.photos_count')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTogglePublish(story)
                      }}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      title={story.isPublished ? t('story.unpublish') : t('story.publish')}
                    >
                      {story.isPublished ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditStory(story)
                      }}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteStory(story.id)
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {stories.length === 0 && (
                <div className="py-24 text-center border border-dashed border-border">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t('ui.no_story')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-4 flex-shrink-0">
            <button
              onClick={() => {
                setStoryEditMode('list')
                setCurrentStory(null)
              }}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {t('admin.back_list')}
            </button>
            <div className="flex items-center gap-4">
              <div className="flex bg-muted p-1 border border-border">
                <button
                  onClick={() => setStoryPreviewActive(false)}
                  className={`p-1.5 transition-all text-[10px] font-black uppercase px-3 ${
                    !storyPreviewActive
                      ? 'bg-background text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {t('ui.edit')}
                </button>
                <button
                  onClick={() => setStoryPreviewActive(true)}
                  className={`p-1.5 transition-all text-[10px] font-black uppercase px-3 ${
                    storyPreviewActive
                      ? 'bg-background text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {t('admin.preview')}
                </button>
              </div>
              <button
                onClick={handleSaveStory}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? t('ui.saving') : t('admin.save')}</span>
              </button>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
            {storyPreviewActive ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar border border-border bg-background p-12 prose prose-invert max-w-none prose-gold prose-serif">
                <h1 className="font-serif text-5xl mb-12 border-b border-border pb-6">
                  {currentStory?.title || t('story.untitled')}
                </h1>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentStory?.content || ''}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <CustomInput
                  variant="config"
                  type="text"
                  value={currentStory?.title || ''}
                  onChange={(e) =>
                    setCurrentStory((prev) => ({
                      ...prev!,
                      title: e.target.value,
                    }))
                  }
                  placeholder={t('story.title_placeholder')}
                  className="text-2xl font-serif p-6"
                />
                <div className="flex items-center gap-3 px-6">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={currentStory?.isPublished || false}
                    onChange={(e) =>
                      setCurrentStory((prev) => ({
                        ...prev!,
                        isPublished: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                  <label
                    htmlFor="isPublished"
                    className="text-xs font-bold uppercase tracking-widest cursor-pointer"
                  >
                    {t('ui.publish_now')}
                  </label>
                </div>
                <div className="flex-1 relative border border-border bg-card/30">
                  <textarea
                    value={currentStory?.content || ''}
                    onChange={(e) =>
                      setCurrentStory((prev) => ({
                        ...prev!,
                        content: e.target.value,
                      }))
                    }
                    placeholder={t('ui.markdown_placeholder')}
                    className="w-full h-full p-8 bg-transparent outline-none resize-none font-mono text-sm leading-relaxed custom-scrollbar"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
