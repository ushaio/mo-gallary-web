'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Sun, Moon, Monitor, Languages } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const { theme, setTheme, mounted } = useTheme()
  const { settings } = useSettings()
  const { t, locale, setLocale } = useLanguage()
  const router = useRouter()

  const siteTitle = settings?.site_title || 'MO GALLERY'

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const toggleTheme = () => {
    if (theme === 'system') setTheme('light')
    else if (theme === 'light') setTheme('dark')
    else setTheme('system')
  }

  const toggleLanguage = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh')
  }

  // Prevent hydration mismatch
  const themeIcon = !mounted ? (
    <Monitor className="w-4 h-4" />
  ) : theme === 'system' ? (
    <motion.div
      key="system"
      initial={{ opacity: 0, rotate: -90 }}
      animate={{ opacity: 1, rotate: 0 }}
      exit={{ opacity: 0, rotate: 90 }}
      transition={{ duration: 0.2 }}
    >
      <Monitor className="w-4 h-4" />
    </motion.div>
  ) : theme === 'light' ? (
    <motion.div
      key="light"
      initial={{ opacity: 0, rotate: -90 }}
      animate={{ opacity: 1, rotate: 0 }}
      exit={{ opacity: 0, rotate: 90 }}
      transition={{ duration: 0.2 }}
    >
      <Sun className="w-4 h-4" />
    </motion.div>
  ) : (
    <motion.div
      key="dark"
      initial={{ opacity: 0, rotate: -90 }}
      animate={{ opacity: 1, rotate: 0 }}
      exit={{ opacity: 0, rotate: 90 }}
      transition={{ duration: 0.2 }}
    >
      <Moon className="w-4 h-4" />
    </motion.div>
  )

  return (
    <nav
      className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all duration-300"
    >
      <div className="max-w-[1920px] mx-auto px-6 md:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <Link href="/" className="group relative">
            <span className="font-serif text-2xl md:text-3xl font-bold tracking-widest text-foreground group-hover:text-primary transition-colors duration-500">
              {siteTitle.toUpperCase()}
            </span>
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-primary transition-all duration-500 group-hover:w-full"></span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-12">
            <div className="flex space-x-8">
              {[
                { name: t('nav.home'), path: '/' },
                { name: t('nav.gallery'), path: '/gallery' },
                { name: t('nav.about'), path: '/about' },
              ].map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="font-sans text-xs font-medium tracking-[0.2em] hover:text-primary transition-colors duration-300 uppercase"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="h-4 w-[1px] bg-border"></div>

            <div className="flex items-center space-x-6">
              <button
                onClick={toggleLanguage}
                className="font-sans text-[10px] font-bold tracking-widest hover:text-primary transition-colors duration-300 flex items-center gap-1"
                aria-label="Toggle Language"
              >
                {locale === 'zh' ? 'EN' : '中'}
              </button>

              <button
                onClick={toggleTheme}
                className="hover:text-primary transition-colors duration-300"
                aria-label="Toggle Theme"
              >
                 <AnimatePresence mode="wait">
                  {themeIcon}
                </AnimatePresence>
              </button>

              {isAuthenticated ? (
                <>
                  <Link 
                    href="/admin" 
                    className="font-sans text-xs font-medium tracking-[0.2em] hover:text-primary transition-colors duration-300 uppercase"
                  >
                    {t('nav.admin')}
                  </Link>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 font-sans text-xs font-medium tracking-[0.2em] hover:text-destructive transition-colors duration-300 uppercase"
                    >
                      <span>{t('nav.logout')}</span>
                      <LogOut className="w-3 h-3" />
                    </button>
                  </div>
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="font-sans text-xs font-medium tracking-[0.2em] hover:text-primary transition-colors duration-300 uppercase"
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
