'use client'

import { useAdmin } from '../layout'
import { LogsTab } from '../LogsTab'

export default function LogsPage() {
  const {
    token,
    photos,
    settings,
    t,
    notify,
  } = useAdmin()

  return (
    <LogsTab
      token={token}
      photos={photos}
      settings={settings}
      t={t}
      notify={notify}
    />
  )
}
