'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, LogOut, Sun, Moon, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSettings } from '@/contexts/SettingsContext'

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const { theme, setTheme, mounted } = useTheme()
  const { settings } = useSettings()
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

  // Prevent hydration mismatch by not rendering theme button until mounted
  const themeIcon = !mounted ? (
    <Monitor className="w-5 h-5 text-muted-foreground" />
  ) : theme === 'system' ? (
    <motion.div
      key="system"
      initial={{ opacity: 0, rotate: -90 }}
      animate={{ opacity: 1, rotate: 0 }}
      exit={{ opacity: 0, rotate: 90 }}
      transition={{ duration: 0.2 }}
    >
      <Monitor className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
    </motion.div>
  ) : theme === 'light' ? (
    <motion.div
      key="light"
      initial={{ opacity: 0, rotate: -90 }}
      animate={{ opacity: 1, rotate: 0 }}
      exit={{ opacity: 0, rotate: 90 }}
      transition={{ duration: 0.2 }}
    >
      <Sun className="w-5 h-5 text-amber-500" />
    </motion.div>
  ) : (
    <motion.div
      key="dark"
      initial={{ opacity: 0, rotate: -90 }}
      animate={{ opacity: 1, rotate: 0 }}
      exit={{ opacity: 0, rotate: 90 }}
      transition={{ duration: 0.2 }}
    >
      <Moon className="w-5 h-5 text-indigo-400" />
    </motion.div>
  )

  return (
    <nav
      className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Camera className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tighter">{siteTitle}</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              首页
            </Link>
            <Link href="/gallery" className="text-sm font-medium hover:text-primary transition-colors">
              相册
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              关于
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-muted transition-colors relative group"
              title={!mounted ? '加载中...' : `当前模式: ${theme === 'system' ? '系统' : theme === 'light' ? '浅色' : '深色'}`}
            >
              {mounted ? (
                <AnimatePresence mode="wait">
                  {themeIcon}
                </AnimatePresence>
              ) : (
                themeIcon
              )}
            </button>

            {isAuthenticated ? (
              <>
                <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                  管理
                </Link>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">{user?.username}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>退出</span>
                  </button>
                </div>
              </>
            ) : (
              <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
                登录
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
