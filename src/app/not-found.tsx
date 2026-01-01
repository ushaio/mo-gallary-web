'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="space-y-8"
      >
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary">Error</span>
          <h1 className="text-9xl md:text-[12rem] font-serif leading-none tracking-tighter opacity-10 select-none">
            404
          </h1>
        </div>

        <div className="space-y-6 max-w-md mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-light">
            Lost in the Void
          </h2>
          <p className="text-sm text-muted-foreground font-serif italic leading-relaxed">
            The page you are looking for has faded into the ether, or perhaps it never existed at all.
          </p>
        </div>

        <div className="pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background text-xs font-bold uppercase tracking-[0.2em] hover:bg-foreground/90 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return Home</span>
          </Link>
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-[10px] text-muted-foreground/30 uppercase tracking-widest font-mono">
          404 • Page Not Found
        </p>
      </div>
    </div>
  )
}