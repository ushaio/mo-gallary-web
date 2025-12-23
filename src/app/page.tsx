'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getFeaturedPhotos, resolveAssetUrl, type PhotoDto } from '@/lib/api'
import { useSettings } from '@/contexts/SettingsContext'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Home() {
  const { settings } = useSettings()
  const { t } = useLanguage()
  const siteTitle = settings?.site_title || 'MO GALLERY'

  const fallbackFeatured: Array<Pick<PhotoDto, 'id' | 'title' | 'category' | 'url' | 'thumbnailUrl'>> = [
    {
      id: 'fallback-1',
      title: 'Urban Silence',
      category: 'Architecture',
      url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'fallback-2',
      title: 'Morning Haze',
      category: 'Nature',
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'fallback-3',
      title: 'Street Pulse',
      category: 'Humanity',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    },
  ]

  const [featuredImages, setFeaturedImages] = useState<
    Array<Pick<PhotoDto, 'id' | 'title' | 'category' | 'url' | 'thumbnailUrl'>>
  >(fallbackFeatured)

  useEffect(() => {
    const run = async () => {
      try {
        const data = await getFeaturedPhotos()
        if (data && data.length > 0) {
          setFeaturedImages(data)
        }
      } catch (err) {
        console.error('Failed to load featured images', err)
      }
    }
    run()
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Hero Section */}
      <section className="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden px-6">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="z-10 text-center mix-blend-difference"
        >
          <h1 className="text-[15vw] md:text-[12vw] font-serif font-light leading-[0.8] tracking-tighter text-foreground">
            {t('home.hero_vis')}
            <span className="block font-sans font-bold text-[4vw] md:text-[2vw] tracking-[0.5em] mt-4 text-primary">
              {t('home.hero_real')}
            </span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute bottom-12 left-6 md:left-12 max-w-xs md:max-w-md"
        >
          <p className="font-sans text-xs md:text-sm tracking-widest text-muted-foreground uppercase leading-relaxed">
            {t('home.hero_desc')}
          </p>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1, duration: 1 }}
           className="absolute bottom-12 right-6 md:right-12"
        >
          <Link 
            href="/gallery" 
            className="group flex items-center gap-4 font-sans text-sm tracking-[0.2em] hover:text-primary transition-colors duration-300"
          >
            {t('home.enter')}
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
          </Link>
        </motion.div>
      </section>

      {/* Featured Works - Stark Grid */}
      <section className="w-full px-6 md:px-12 py-32 border-t border-border/50">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24">
          <h2 className="font-serif text-5xl md:text-7xl font-light text-foreground">
            {t('home.curated')}<br />{t('home.works')}
          </h2>
          <div className="mt-8 md:mt-0 text-right">
             <span className="block font-sans text-xs tracking-[0.2em] text-primary mb-2">{t('home.latest')}</span>
             <p className="font-sans text-sm text-muted-foreground max-w-xs ml-auto">
               {t('home.latest_desc')}
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {featuredImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="group relative cursor-pointer"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                 <div className="absolute top-4 left-4 z-10 font-sans text-xs font-bold text-white mix-blend-difference tracking-widest">
                    {(index + 1).toString().padStart(2, '0')}
                 </div>
                <img 
                  src={resolveAssetUrl(image.thumbnailUrl || image.url)} 
                  alt={image.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out scale-100 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
              </div>
              
              <div className="mt-6 flex justify-between items-start border-b border-border pb-4 group-hover:border-primary transition-colors duration-500">
                <div>
                  <h3 className="font-serif text-2xl text-foreground group-hover:text-primary transition-colors duration-300">{image.title}</h3>
                  <p className="font-sans text-xs text-muted-foreground uppercase tracking-widest mt-1">{image.category}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary -rotate-45 group-hover:rotate-0 transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section - Text Heavy */}
      <section className="w-full py-32 bg-secondary text-secondary-foreground">
        <div className="max-w-[1920px] mx-auto px-6 md:px-12 flex flex-col md:flex-row gap-16 md:gap-32">
          <div className="w-full md:w-1/3">
             <h2 className="font-sans text-xs font-bold tracking-[0.2em] text-primary mb-8">{t('home.artist')}</h2>
             <div className="w-full h-[1px] bg-border mb-8"></div>
             <p className="font-serif text-3xl md:text-4xl leading-tight">
               {t('home.quote')}
             </p>
          </div>
          <div className="w-full md:w-2/3 flex flex-col justify-between">
             <div className="prose prose-invert max-w-none">
                <p className="font-sans text-lg md:text-xl text-muted-foreground leading-relaxed">
                  {t('home.about_text')}
                </p>
             </div>
             <div className="mt-12">
               <Link
                href="/about"
                className="inline-block border border-primary px-8 py-4 font-sans text-xs tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                {t('home.read_bio')}
              </Link>
             </div>
          </div>
        </div>
      </section>
    </div>
  )
}
