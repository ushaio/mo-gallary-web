import 'server-only'
import { Hono } from 'hono'
import { signToken } from '~/server/lib/jwt'

const auth = new Hono()

auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400)
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    if (username !== adminUsername || password !== adminPassword) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const token = signToken({
      sub: 'admin',
      username: adminUsername,
    })

    return c.json({
      success: true,
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default auth
