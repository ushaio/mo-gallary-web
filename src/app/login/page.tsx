'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { login as apiLogin } from '@/lib/api'
import { ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = await apiLogin({ username, password })
      login(token, username)
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
           <h1 className="font-serif text-5xl font-light tracking-tighter text-foreground mb-4">
             {t('login.title')}
           </h1>
           <p className="font-sans text-xs tracking-[0.2em] text-muted-foreground uppercase">
             {t('login.subtitle')}
           </p>
        </div>

        {error && (
          <div className="mb-8 p-4 border border-destructive/50 text-destructive text-xs tracking-widest uppercase text-center">
            {t('common.error')}: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="group">
            <label htmlFor="username" className="block text-[10px] font-bold tracking-[0.2em] uppercase mb-2 text-muted-foreground group-focus-within:text-primary transition-colors">
              {t('login.identity')}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-transparent border-b border-border focus:border-primary outline-none transition-colors text-foreground font-mono placeholder:text-muted-foreground/20"
              placeholder={t('login.placeholder_user')}
            />
          </div>

          <div className="group">
            <label htmlFor="password" className="block text-[10px] font-bold tracking-[0.2em] uppercase mb-2 text-muted-foreground group-focus-within:text-primary transition-colors">
              {t('login.passcode')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-transparent border-b border-border focus:border-primary outline-none transition-colors text-foreground font-mono placeholder:text-muted-foreground/20"
              placeholder={t('login.placeholder_pass')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-foreground text-background font-bold tracking-[0.2em] text-xs uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {loading ? t('login.auth') : t('login.enter')}
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </div>
    </div>
  )
}
