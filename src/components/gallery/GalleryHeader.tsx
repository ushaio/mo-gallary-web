'use client'

import { motion } from 'framer-motion'

interface GalleryHeaderProps {
  activeCategory: string
  categories: string[]
  onCategoryChange: (category: string) => void
  photoCount: number
  t: (key: string) => string
}

export function GalleryHeader({
  activeCategory,
  categories,
  onCategoryChange,
  photoCount,
  t,
}: GalleryHeaderProps) {
  return (
    <header className="mb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-primary"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Collection</span>
            <div className="h-[1px] w-12 bg-primary/30" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif font-light tracking-tighter leading-none"
          >
            {activeCategory === '全部' ? t('gallery.title') : activeCategory}
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-start md:items-end gap-4"
        >
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            {photoCount} {t('gallery.count_suffix')}
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all border ${activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
              >
                {cat === '全部' ? t('gallery.all') : cat}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </header>
  )
}
