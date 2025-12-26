import 'server-only'
import { Hono } from 'hono'
import { db } from '~/server/lib/db'
import { authMiddleware, AuthVariables } from './middleware/auth'

const settings = new Hono<{ Variables: AuthVariables }>()

// Public endpoint for getting public settings (no auth required)
settings.get('/public', async (c) => {
  try {
    const settingsList = await db.setting.findMany({
      where: {
        key: {
          in: ['site_title', 'cdn_domain'],
        },
      },
    })

    const config: Record<string, string> = {
      site_title: 'MO GALLERY',
      cdn_domain: '',
    }

    settingsList.forEach((s) => {
      config[s.key] = s.value
    })

    return c.json({
      success: true,
      data: config,
    })
  } catch (error) {
    console.error('Get public settings error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// All other settings endpoints are protected
settings.use('/*', authMiddleware)

settings.get('/', async (c) => {
  try {
    const settingsList = await db.setting.findMany()

    const config: Record<string, string> = {
      site_title: '',
      storage_provider: 'local',
      cdn_domain: '',
      r2_access_key_id: '',
      r2_secret_access_key: '',
      r2_bucket: '',
      r2_endpoint: '',
      github_token: '',
      github_repo: '',
      github_path: '',
      github_branch: '',
      github_access_method: '',
      github_pages_url: '',
    }

    settingsList.forEach((s) => {
      config[s.key] = s.value
    })

    return c.json({
      success: true,
      data: config,
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

settings.patch('/', async (c) => {
  try {
    const data = await c.req.json()

    // Use transaction to avoid prepared statement conflicts with connection poolers
    await db.$transaction(
      Object.keys(data).map((key) =>
        db.setting.upsert({
          where: { key },
          update: { value: String(data[key]) },
          create: { key, value: String(data[key]) },
        }),
      ),
    )

    // Return updated settings
    const settingsList = await db.setting.findMany()
    const config: Record<string, string> = {}

    settingsList.forEach((s) => {
      config[s.key] = s.value
    })

    return c.json({
      success: true,
      data: config,
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default settings
