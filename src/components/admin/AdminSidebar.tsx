'use client'

import { LogOut, LucideIcon } from 'lucide-react'
import { AdminButton } from '@/components/admin/AdminButton'

interface SidebarItem {
  id: string
  label: string
  icon: LucideIcon
}

interface AdminSidebarProps {
  siteTitle: string
  isMobileMenuOpen: boolean
  activeTab: string
  onTabChange: (tab: string) => void
  user: { username?: string } | null
  onLogout: () => void
  t: (key: string) => string
  items: SidebarItem[]
}

export function AdminSidebar({
  siteTitle,
  isMobileMenuOpen,
  activeTab,
  onTabChange,
  user,
  onLogout,
  t,
  items,
}: AdminSidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border transform transition-transform duration-300 md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-8 border-b border-border">
          <h2 className="font-serif text-2xl font-bold tracking-tight">
            {siteTitle}
          </h2>
          <p className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            {t('admin.console')}
          </p>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {items.map((item) => (
            <AdminButton
              key={item.id}
              onClick={() => onTabChange(item.id)}
              adminVariant="tab"
              data-state={activeTab === item.id ? 'active' : 'inactive'}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </AdminButton>
          ))}
        </nav>
        <div className="p-6 border-t border-border">
          <div className="flex items-center space-x-3 mb-6 px-2">
            <div className="w-8 h-8 bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold">
              {user?.username?.substring(0, 1).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate uppercase tracking-wider">
                {user?.username || 'ADMIN'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">
                {t('admin.super_user')}
              </p>
            </div>
          </div>
          <AdminButton
            onClick={onLogout}
            adminVariant="destructiveOutline"
            size="lg"
            className="w-full flex items-center space-x-3 text-xs font-bold uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout')}</span>
          </AdminButton>
        </div>
      </div>
    </aside>
  )
}

