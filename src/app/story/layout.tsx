import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Story',
  description: 'Photo stories and visual narratives.',
  alternates: {
    canonical: '/story',
  },
  openGraph: {
    title: 'Story',
    description: 'Photo stories and visual narratives.',
    url: '/story',
    type: 'website',
  },
}

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return children
}