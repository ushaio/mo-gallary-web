'use client'

import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { getPhotoStory, type StoryDto } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import ReactMarkdown from 'react-markdown'

interface StoryTabProps {
  photoId: string
}

export function StoryTab({ photoId }: StoryTabProps) {
  const { t, locale } = useLanguage()
  const [story, setStory] = useState<StoryDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStory() {
      try {
        setLoading(true)
        setError(null)
        const data = await getPhotoStory(photoId)
        setStory(data)
      } catch (err) {
        console.error('Failed to load story:', err)
        setError(err instanceof Error ? err.message : 'Failed to load story')
      } finally {
        setLoading(false)
      }
    }

    fetchStory()
  }, [photoId])

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="space-y-2 mt-6">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="text-center text-destructive py-12">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="text-center text-muted-foreground py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">{t('gallery.no_story')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
      {/* Story Header */}
      <div className="space-y-3">
        <h3 className="font-serif text-2xl leading-tight text-foreground">
          {story.title}
        </h3>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
          {new Date(story.createdAt).toLocaleDateString(locale)}
        </div>
      </div>

      {/* Story Content */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="font-serif text-xl mb-4 text-foreground">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="font-serif text-lg mb-3 text-foreground">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="font-serif text-base mb-2 text-foreground">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-sm leading-relaxed mb-4 text-foreground">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-4 text-sm text-foreground">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-4 text-sm text-foreground">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="mb-1 text-foreground">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                {children}
              </blockquote>
            ),
            code: ({ children }) => (
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-muted p-4 rounded overflow-x-auto mb-4">
                {children}
              </pre>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {story.content}
        </ReactMarkdown>
      </div>

      {/* Related Photos Count */}
      {story.photos && story.photos.length > 1 && (
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {story.photos.length} {locale === 'zh' ? '张相关照片' : 'related photos'}
          </p>
        </div>
      )}
    </div>
  )
}
