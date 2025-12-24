import 'server-only'
import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { db } from '~/server/lib/db'
import { signToken } from '~/server/lib/jwt'

const auth = new Hono()

auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400)
    }

    const user = await db.user.findUnique({
      where: { username },
    })

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const token = signToken({
      sub: user.id,
      username: user.username,
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
