'use client'

import { useSettings } from '@/contexts/SettingsContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function Footer() {
  const { settings } = useSettings()
  const { t } = useLanguage()
  const siteTitle = settings?.site_title || 'MO GALLERY'
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-background text-foreground pt-24 pb-12 border-t border-border overflow-hidden">
      <div className="max-w-[1920px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-24">
          <div className="md:col-span-6 flex flex-col justify-between h-full">
             <h2 className="font-serif text-5xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none mb-8 text-primary/90">
              {siteTitle.toUpperCase()}
            </h2>
            <p className="font-sans text-sm tracking-[0.2em] text-muted-foreground uppercase max-w-md">
              {t('footer.desc')}
            </p>
          </div>
          
          <div className="md:col-span-2 md:col-start-9">
            <h3 className="font-sans text-xs font-bold tracking-[0.2em] mb-6 text-primary uppercase">{t('footer.navigation')}</h3>
            <ul className="space-y-4">
              {[
                { name: t('nav.home'), path: '/' },
                { name: t('nav.gallery'), path: '/gallery' },
                { name: t('nav.about'), path: '/about' },
                { name: t('nav.login'), path: '/login' },
              ].map((item) => (
                 <li key={item.path}>
                  <Link href={item.path} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 uppercase">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-sans text-xs font-bold tracking-[0.2em] mb-6 text-primary uppercase">{t('footer.social')}</h3>
            <ul className="space-y-4">
              {['Instagram', 'Twitter', 'Behance'].map((item) => (
                 <li key={item}>
                  <a href="#" className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 uppercase">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end border-t border-border pt-8">
          <p className="font-sans text-xs text-muted-foreground tracking-[0.1em] uppercase">
            © {currentYear} {siteTitle}. {t('footer.rights')}
          </p>
          <p className="font-sans text-xs text-muted-foreground tracking-[0.1em] mt-4 md:mt-0 uppercase">
            {t('footer.designed_by')}
          </p>
        </div>
      </div>
    </footer>
  )
}