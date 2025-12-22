'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getPublicSettings, type PublicSettingsDto } from '@/lib/api'

interface SettingsContextType {
  settings: PublicSettingsDto | null
  isLoading: boolean
  refresh: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettingsDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = async () => {
    setIsLoading(true)
    try {
      const data = await getPublicSettings()
      setSettings(data)
    } catch (error) {
      console.error('Failed to load settings:', error)
      // Use default settings on error
      setSettings({
        site_title: 'MO GALLERY',
        cdn_domain: '',
      })
    } finally {
      setIsLoading(false)
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
