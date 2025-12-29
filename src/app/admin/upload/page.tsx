'use client'

import { useRouter } from 'next/navigation'
import { useAdmin } from '../layout'
import { UploadTab } from '../UploadTab'

export default function UploadPage() {
  const router = useRouter()
  const {
    token,
    categories,
    settings,
    t,
    notify,
    refreshPhotos,
  } = useAdmin()

  return (
    <UploadTab
      token={token}
      categories={categories}
      settings={settings}
      t={t}
      notify={notify}
      onUploadSuccess={() => {
        router.push('/admin/photos')
        refreshPhotos()
      }}
      onPreview={(item) => {
        const url = URL.createObjectURL(item.file)
        window.open(url, '_blank')
      }}
    />
  )
}
