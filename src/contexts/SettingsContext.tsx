'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getPublicSettings, type PublicSettingsDto } from '@/lib/api'

interface SettingsContextType {
  settings: PublicSettingsDto | null
  isLoading: boolean
  refresh: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const CACHE_KEY = 'mo_gallery_settings'

const IS_DEV = process.env.NODE_ENV === 'development'

interface CachedSettings {
  buildId: string
  data: PublicSettingsDto
  envHash: string
}

function getEnvHash(): string {
  const relevantKeys = ['COMMENTS_STORAGE', 'WALINE_SERVER_URL']
  return relevantKeys
    .map(key => `${key}=${process.env[key] || ''}`)
    .join('|')
}

function getCachedSettings(): PublicSettingsDto | null {
  if (typeof window === 'undefined') return null
  if (IS_DEV) return null

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const { buildId, data, envHash }: CachedSettings = JSON.parse(cached)
    const currentEnvHash = getEnvHash()
    if (buildId === process.env.NEXT_PUBLIC_BUILD_ID && envHash === currentEnvHash) {
      return data
    }
    localStorage.removeItem(CACHE_KEY)
  } catch {}
  return null
}

function setCachedSettings(data: PublicSettingsDto) {
  if (typeof window === 'undefined') return
  if (IS_DEV) return
  try {
    const cached: CachedSettings = {
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || '',
      data,
      envHash: getEnvHash(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  } catch {}
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettingsDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = async (force = false) => {
    if (!force) {
      const cached = getCachedSettings()
      if (cached) {
        setSettings(cached)
        setIsLoading(false)
        return
      }
    }
    setIsLoading(true)
    try {
      const data = await getPublicSettings()
      setSettings(data)
      setCachedSettings(data)
    } catch (error) {
      console.error('Failed to load settings:', error)
      setSettings({
        site_title: 'MO GALLERY',
        cdn_domain: '',
        linuxdo_only: false,
        comments_storage: '',
        waline_server_url: '',
      })
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refresh }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
