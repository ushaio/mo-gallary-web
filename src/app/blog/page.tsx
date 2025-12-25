'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BookText, Calendar, ArrowRight, Clock, Tag } from 'lucide-react'
import Link from 'next/link'
import { getBlogs, getBlogCategories, type BlogDto } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'

export default function BlogListPage() {
  const { t } = useLanguage()
  const [blogs, setBlogs] = useState<BlogDto[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('全部')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [blogsData, categoriesData] = await Promise.all([
          getBlogs(),
          getBlogCategories()
        ])
        setBlogs(blogsData)
        setCategories(['全部', ...categoriesData])
      } catch (error) {
        console.error('Failed to fetch blog data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter blogs by category
  const filteredBlogs = useMemo(() => {
    if (activeCategory === '全部') return blogs
    return blogs.filter(blog => blog.category === activeCategory)
  }, [blogs, activeCategory])

  // Group blogs by year and month for timeline
  const timelineData = useMemo(() => {
    const grouped: Record<string, Record<string, BlogDto[]>> = {}

    filteredBlogs.forEach(blog => {
      const date = new Date(blog.createdAt)
      const year = date.getFullYear().toString()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')

      if (!grouped[year]) grouped[year] = {}
      if (!grouped[year][month]) grouped[year][month] = []
      grouped[year][month].push(blog)
    })

    return grouped
  }, [filteredBlogs])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24 pb-16 px-4 md:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded w-1/3"></div>
            <div className="flex gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded w-20"></div>
              ))}
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4 border-l-2 border-border pl-8">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-primary mb-4"
          >
            <BookText className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Blog</span>
            <div className="h-[1px] flex-1 bg-primary/30" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif font-light tracking-tighter leading-none"
          >
            博客
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-muted-foreground"
          >
            摄影随笔与创作心得
          </motion.p>
        </header>

        {/* Category Filter */}
        {categories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                分类筛选
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    activeCategory === category
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              共 {filteredBlogs.length} 篇文章
            </div>
          </motion.div>
        )}

        {/* Timeline */}
        {filteredBlogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border border-dashed border-border"
          >
            <BookText className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">暂无博客文章</p>
          </motion.div>
        ) : (
          <div className="space-y-16">
            {Object.keys(timelineData)
              .sort((a, b) => parseInt(b) - parseInt(a))
              .map((year, yearIndex) => (
                <motion.div
                  key={year}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + yearIndex * 0.1 }}
                >
                  {/* Year Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <h2 className="text-3xl font-serif font-light tracking-tight">
                        {year}
                      </h2>
                    </div>
                    <div className="flex-1 h-[1px] bg-border" />
                  </div>

                  {/* Months */}
                  <div className="space-y-12">
                    {Object.keys(timelineData[year])
                      .sort((a, b) => parseInt(b) - parseInt(a))
                      .map((month) => (
                        <div key={`${year}-${month}`} className="relative">
                          {/* Month Label */}
                          <div className="flex items-center gap-4 mb-6">
                            <div className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
                              {month} 月
                            </div>
                            <div className="flex-1 h-[1px] bg-border/50" />
                          </div>

                          {/* Blog Posts */}
                          <div className="space-y-6 pl-8 border-l-2 border-border">
                            {timelineData[year][month].map((blog, index) => (
                              <motion.article
                                key={blog.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative group"
                              >
                                {/* Timeline Dot */}
                                <div className="absolute -left-[33px] top-2 w-2 h-2 rounded-full bg-border group-hover:bg-primary transition-colors" />

                                <Link
                                  href={`/blog/${blog.id}`}
                                  className="block space-y-3 p-6 -ml-8 border border-transparent hover:border-border hover:bg-card/30 transition-all"
                                >
                                  {/* Title */}
                                  <h3 className="text-2xl font-serif font-light leading-tight group-hover:text-primary transition-colors">
                                    {blog.title}
                                  </h3>

                                  {/* Meta */}
                                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(blog.createdAt).toLocaleDateString('zh-CN', {
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </div>
                                    {blog.category && blog.category !== '未分类' && (
                                      <div className="flex items-center gap-1">
                                        <Tag className="w-3 h-3" />
                                        {blog.category}
                                      </div>
                                    )}
                                  </div>

                                  {/* Excerpt */}
                                  <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                                    {blog.content.replace(/[#*`\[\]]/g, '').substring(0, 150)}...
                                  </p>

                                  {/* Read More */}
                                  <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    阅读全文
                                    <ArrowRight className="w-3 h-3" />
                                  </div>
                                </Link>
                              </motion.article>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              ))}
          </div>
        )}

        {/* Back to Gallery */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <Link
            href="/gallery"
            className="inline-block px-8 py-3 border border-border hover:border-primary hover:text-primary transition-all text-xs font-bold uppercase tracking-widest"
          >
            返回画廊
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
