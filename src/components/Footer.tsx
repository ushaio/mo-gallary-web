'use client'

import { useSettings } from '@/contexts/SettingsContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const { settings } = useSettings()
  const { t } = useLanguage()
  const pathname = usePathname()
  const siteTitle = settings?.site_title || 'MO GALLERY'
  const currentYear = new Date().getFullYear()

  // Hide footer on admin pages
  if (pathname?.startsWith('/admin/')) {
    return null
  }

  return (
    <footer className="relative bg-background text-foreground pt-16 md:pt-24 pb-8 md:pb-12 border-t border-border overflow-hidden">
      <div className="max-w-[1920px] mx-auto px-4 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-8 mb-12 md:mb-24">
          {/* Logo & Description - Full width on mobile */}
          <div className="col-span-2 md:col-span-6 flex flex-col justify-between h-full">
            <h2 className="font-serif text-4xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-none mb-4 md:mb-8 text-primary/90">
              {siteTitle.toUpperCase()}
            </h2>
            <p className="font-sans text-xs md:text-sm tracking-[0.15em] md:tracking-[0.2em] text-muted-foreground uppercase max-w-md">
              {t('footer.desc')}
            </p>
          </div>

          {/* Navigation - Half width on mobile */}
          <div className="col-span-1 md:col-span-2 md:col-start-9">
            <h3 className="font-sans text-[10px] md:text-xs font-bold tracking-[0.2em] mb-4 md:mb-6 text-primary uppercase">{t('footer.navigation')}</h3>
            <ul className="space-y-3 md:space-y-4">
              {[
                { name: t('nav.home'), path: '/' },
                { name: t('nav.gallery'), path: '/gallery' },
                { name: t('nav.about'), path: '/about' },
                { name: t('nav.login'), path: '/login' },
              ].map((item) => (
                <li key={item.path}>
                  <Link href={item.path} className="font-sans text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 uppercase">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social - Half width on mobile */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-sans text-[10px] md:text-xs font-bold tracking-[0.2em] mb-4 md:mb-6 text-primary uppercase">{t('footer.social')}</h3>
            <ul className="space-y-3 md:space-y-4">
              {['Instagram', 'Twitter', 'Behance'].map((item) => (
                <li key={item}>
                  <a href="#" className="font-sans text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 uppercase">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-t border-border pt-6 md:pt-8 gap-2 md:gap-0">
          <p className="font-sans text-[10px] md:text-xs text-muted-foreground tracking-[0.1em] uppercase">
            © {currentYear} {siteTitle}. {t('footer.rights')}
          </p>
          <p className="font-sans text-[10px] md:text-xs text-muted-foreground tracking-[0.1em] uppercase">
            {t('footer.designed_by')}
          </p>
        </div>
      </div>
    </footer>
  )
}