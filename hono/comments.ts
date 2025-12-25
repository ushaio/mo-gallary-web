import 'server-only'
import { Hono } from 'hono'
import { db } from '~/server/lib/db'
import { authMiddleware, AuthVariables } from './middleware/auth'
import { z } from 'zod'

const comments = new Hono<{ Variables: AuthVariables }>()

// Validation schemas
const CreateCommentSchema = z.object({
  author: z.string().min(1).max(100).trim(),
  email: z.string().email().optional(),
  content: z.string().min(1).max(2000).trim(),
})

const UpdateCommentStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

// Public endpoints - Get approved comments for a photo
comments.get('/photos/:photoId/comments', async (c) => {
  try {
    const photoId = c.req.param('photoId')

    const commentsList = await db.comment.findMany({
      where: {
        photoId,
        status: 'approved',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        author: true,
        content: true,
        createdAt: true,
      },
    })

    return c.json({
      success: true,
      data: commentsList,
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Public endpoint - Submit a new comment
comments.post('/photos/:photoId/comments', async (c) => {
  try {
    const photoId = c.req.param('photoId')
    const body = await c.req.json()
    const validated = CreateCommentSchema.parse(body)

    // Get client IP
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'

    // Check if photo exists
    const photo = await db.photo.findUnique({
      where: { id: photoId },
    })

    if (!photo) {
      return c.json({ error: 'Photo not found' }, 404)
    }

    // Get comment moderation setting
    const moderationSetting = await db.setting.findUnique({
      where: { key: 'comment_moderation' },
    })

    const requiresModeration = moderationSetting?.value === 'true'

    // Create comment
    const comment = await db.comment.create({
      data: {
        photoId,
        author: validated.author,
        email: validated.email,
        content: validated.content,
        status: requiresModeration ? 'pending' : 'approved',
        ip,
      },
    })

    return c.json({
      success: true,
      data: {
        id: comment.id,
        author: comment.author,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        status: comment.status,
      },
      message: requiresModeration
        ? 'Comment submitted and pending approval'
        : 'Comment posted successfully',
    })
  } catch (error) {
    console.error('Create comment error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Protected admin endpoints
comments.use('/admin/*', authMiddleware)

// Get all comments (admin)
comments.get('/admin/comments', async (c) => {
  try {
    const status = c.req.query('status')
    const photoId = c.req.query('photoId')

    const where: any = {}
    if (status) where.status = status
    if (photoId) where.photoId = photoId

    const commentsList = await db.comment.findMany({
      where,
      include: {
        photo: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return c.json({
      success: true,
      data: commentsList,
    })
  } catch (error) {
    console.error('Get admin comments error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update comment status (admin)
comments.patch('/admin/comments/:id/status', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validated = UpdateCommentStatusSchema.parse(body)

    const comment = await db.comment.update({
      where: { id },
      data: { status: validated.status },
    })

    return c.json({
      success: true,
      data: comment,
    })
  } catch (error) {
    console.error('Update comment status error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Delete comment (admin)
comments.delete('/admin/comments/:id', async (c) => {
  try {
    const id = c.req.param('id')

    await db.comment.delete({
      where: { id },
    })

    return c.json({
      success: true,
      message: 'Comment deleted successfully',
    })
  } catch (error) {
    console.error('Delete comment error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default comments
