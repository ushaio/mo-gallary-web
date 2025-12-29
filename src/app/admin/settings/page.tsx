'use client'

import { useAdmin } from '../layout'
import { SettingsTab } from '../SettingsTab'

export default function SettingsPage() {
  const {
    token,
    settings,
    setSettings,
    categories,
    settingsLoading,
    settingsSaving,
    settingsError,
    handleSaveSettings,
    t,
    notify,
    handleUnauthorized,
  } = useAdmin()

  return (
    <SettingsTab
      token={token}
      settings={settings}
      setSettings={setSettings}
      categories={categories}
      loading={settingsLoading}
      saving={settingsSaving}
      error={settingsError}
      onSave={handleSaveSettings}
      t={t}
      notify={notify}
      onUnauthorized={handleUnauthorized}
    />
  )
}
