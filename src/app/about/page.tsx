'use client'

import Link from 'next/link'
import { ArrowRight, Mail, Instagram, Twitter } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function About() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center">
      <div className="max-w-[1920px] mx-auto px-6 py-24 md:py-12 w-full">
        <div className="flex flex-col md:flex-row gap-16 lg:gap-32 items-stretch">
          
          {/* Left Column: Image */}
          <div className="w-full md:w-1/2 relative min-h-[50vh] md:min-h-[70vh]">
            <div className="absolute inset-0 bg-secondary overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=1200&q=80" 
                alt="The Artist" 
                className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-1000 ease-out"
              />
              <div className="absolute inset-0 border border-border/50" />
            </div>
            
            {/* Overlay Text */}
            <div className="absolute bottom-[-2rem] right-[-1rem] md:right-[-4rem] z-10 bg-background border border-border p-6 md:p-8 max-w-xs">
              <p className="font-serif text-3xl italic">
                {t('about.quote')}
              </p>
            </div>
          </div>

          {/* Right Column: Text */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <div className="mb-12">
               <span className="block font-sans text-xs font-bold tracking-[0.2em] text-primary mb-4 uppercase">
                 {t('about.bio_label')}
               </span>
               <h1 className="font-serif text-6xl md:text-8xl font-light tracking-tighter leading-none mb-8">
                 {t('about.title')}<br/>{t('about.subtitle')}
               </h1>
            </div>

            <div className="prose prose-lg prose-invert text-muted-foreground font-serif leading-relaxed space-y-6">
              <p>
                <span className="text-foreground text-5xl float-left mr-3 mt-[-10px] font-serif">{t('about.p1_start')}</span>
                {t('about.p1')}
              </p>
              <p>
                {t('about.p2')}
              </p>
            </div>

            <div className="mt-16 border-t border-border pt-8">
              <h3 className="font-sans text-xs font-bold tracking-[0.2em] text-primary mb-8 uppercase">
                {t('about.contact')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                   <a href="mailto:hi@mogallery.com" className="flex items-center gap-4 group">
                     <div className="p-3 border border-border group-hover:bg-primary group-hover:text-background transition-colors">
                       <Mail className="w-4 h-4" />
                     </div>
                     <span className="font-sans text-sm tracking-widest uppercase text-muted-foreground group-hover:text-foreground transition-colors">
                       hi@mogallery.com
                     </span>
                   </a>
                 </div>

                 <div className="flex gap-4">
                    <a href="#" className="p-3 border border-border hover:bg-primary hover:text-background transition-colors">
                      <Instagram className="w-4 h-4" />
                    </a>
                    <a href="#" className="p-3 border border-border hover:bg-primary hover:text-background transition-colors">
                      <Twitter className="w-4 h-4" />
                    </a>
                 </div>
              </div>
            </div>

            <div className="mt-12">
               <Link href="/gallery" className="inline-flex items-center gap-2 font-sans text-xs font-bold tracking-[0.2em] uppercase hover:text-primary transition-colors group">
                 {t('about.view_portfolio')} <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
