'use client'

import { useSettings } from '@/contexts/SettingsContext'

export default function Footer() {
  const { settings } = useSettings()
  const siteTitle = settings?.site_title || 'MO GALLERY'

  return (
    <footer className="border-t py-12 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
        <p>© 2025 {siteTitle}. All rights reserved.</p>
      </div>
    </footer>
  )
}
