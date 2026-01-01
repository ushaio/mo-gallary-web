'use client'

import { useAdmin } from '../layout'
import { PhotosTab } from '../PhotosTab'

export default function PhotosPage() {
  const {
    photos,
    categories,
    photosLoading,
    photosError,
    photosViewMode,
    setPhotosViewMode,
    selectedPhotoIds,
    handleSelectPhotoToggle,
    handleSelectAllPhotos,
    handleDelete,
    refreshPhotos,
    handleToggleFeatured,
    setSelectedPhoto,
    t,
    settings,
  } = useAdmin()

  return (
    <PhotosTab
      photos={photos}
      categories={categories}
      loading={photosLoading}
      error={photosError}
      viewMode={photosViewMode}
      selectedIds={selectedPhotoIds}
      onViewModeChange={setPhotosViewMode}
      onSelect={handleSelectPhotoToggle}
      onSelectAll={handleSelectAllPhotos}
      onDelete={handleDelete}
      onRefresh={refreshPhotos}
      onToggleFeatured={handleToggleFeatured}
      onPreview={setSelectedPhoto}
      t={t}
      settings={settings}
    />
  )
}
