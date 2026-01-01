'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isReady, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.push('/login')
      return
    }

    // If admin access is required but user is not admin, redirect to home
    if (isReady && isAuthenticated && requireAdmin && !user?.isAdmin) {
      router.push('/')
    }
  }, [isAuthenticated, isReady, router, requireAdmin, user?.isAdmin])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">正在加载...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">正在验证身份...</p>
        </div>
      </div>
    )
  }

  // Show access denied message briefly before redirect for non-admin users
  if (requireAdmin && !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">访问被拒绝 / Access Denied</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
