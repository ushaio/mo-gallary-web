'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getFeaturedPhotos, resolveAssetUrl, type PhotoDto } from '@/lib/api'
import { useSettings } from '@/contexts/SettingsContext'

export default function Home() {
  const { settings } = useSettings()
  const siteTitle = settings?.site_title || 'MO GALLERY'

  const fallbackFeatured: Array<Pick<PhotoDto, 'id' | 'title' | 'category' | 'url' | 'thumbnailUrl'>> = [
    {
      id: 'fallback-1',
      title: '城市光影',
      category: '建筑',
      url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'fallback-2',
      title: '林间清晨',
      category: '自然',
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'fallback-3',
      title: '街头瞬间',
      category: '人文',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    },
  ]

  const [featuredImages, setFeaturedImages] = useState<
    Array<Pick<PhotoDto, 'id' | 'title' | 'category' | 'url' | 'thumbnailUrl'>>
  >(fallbackFeatured)
  const [featuredError, setFeaturedError] = useState('')

  useEffect(() => {
    const run = async () => {
      setFeaturedError('')
      try {
        const data = await getFeaturedPhotos()
        setFeaturedImages(data)
      } catch (err) {
        setFeaturedError(err instanceof Error ? err.message : '加载精选作品失败')
      }
    }
    run()
  }, [])

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden bg-muted">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2000&q=80" 
            alt="Hero" 
            className="w-full h-full object-cover brightness-75 dark:brightness-50"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center px-4">
          <h1 
            className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6"
          >
            捕获瞬间的永恒
          </h1>
          <p 
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8"
          >
            在这里，每一张照片都是一个故事。探索自然、城市与人文交织的世界。
          </p>
          <div>
            <Link 
              href="/gallery" 
              className="inline-flex items-center px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-colors group"
            >
              浏览相册
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Works */}
      <section className="max-w-7xl w-full px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">精选作品</h2>
            <p className="text-muted-foreground mt-2">每一张都是精心挑选的瞬间</p>
          </div>
          <Link href="/gallery" className="text-sm font-medium hover:underline flex items-center">
            查看全部 <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        {featuredError && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded">
            后端未连接（{featuredError}），已回退到示例数据
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredImages.map((image, index) => (
            <div
              key={image.id}
              className="group relative cursor-pointer"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                <img 
                  src={resolveAssetUrl(image.thumbnailUrl || image.url)} 
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold">{image.title}</h3>
                <p className="text-sm text-muted-foreground">{image.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="w-full bg-muted/30 py-24">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">关于 {siteTitle}</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            {siteTitle} 是一个致力于展示高质量摄影作品的平台。我们相信影像的力量，
            它能够跨越语言与文化的障碍，触动人心。
          </p>
          <Link
            href="/about"
            className="text-sm font-semibold border-b-2 border-primary pb-1 hover:text-muted-foreground hover:border-muted-foreground transition-colors"
          >
            了解更多关于我的故事
          </Link>
        </div>
      </section>
    </div>
  )
}
