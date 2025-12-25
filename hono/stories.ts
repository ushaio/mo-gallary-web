import 'server-only'
import { Hono } from 'hono'
import { db } from '~/server/lib/db'
import { authMiddleware, AuthVariables } from './middleware/auth'
import { z } from 'zod'

const stories = new Hono<{ Variables: AuthVariables }>()

// Validation schemas
const CreateStorySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  isPublished: z.boolean().default(false),
  photoIds: z.array(z.string().uuid()).optional(),
})

const UpdateStorySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  isPublished: z.boolean().optional(),
})

const AddPhotosSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1),
})

// Public endpoints
stories.get('/stories', async (c) => {
  try {
    const storiesList = await db.story.findMany({
      where: { isPublished: true },
      include: {
        photos: {
          include: { categories: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = storiesList.map((story) => ({
      ...story,
      photos: story.photos.map((p) => ({
        ...p,
        category: p.categories.map((c) => c.name).join(','),
      })),
    }))

    return c.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get stories error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

stories.get('/stories/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const story = await db.story.findUnique({
      where: { id, isPublished: true },
      include: {
        photos: {
          include: { categories: true },
        },
      },
    })

    if (!story) {
      return c.json({ error: 'Story not found' }, 404)
    }

    const data = {
      ...story,
      photos: story.photos.map((p) => ({
        ...p,
        category: p.categories.map((c) => c.name).join(','),
      })),
    }

    return c.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get story error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get story for a specific photo
stories.get('/photos/:photoId/story', async (c) => {
  try {
    const photoId = c.req.param('photoId')

    const story = await db.story.findFirst({
      where: {
        isPublished: true,
        photos: {
          some: { id: photoId },
        },
      },
      include: {
        photos: {
          include: { categories: true },
        },
      },
    })

    if (!story) {
      return c.json({ error: 'No story found for this photo' }, 404)
    }

    const data = {
      ...story,
      photos: story.photos.map((p) => ({
        ...p,
        category: p.categories.map((c) => c.name).join(','),
      })),
    }

    return c.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get photo story error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Protected admin endpoints
stories.use('/admin/*', authMiddleware)

stories.get('/admin/stories', async (c) => {
  try {
    const storiesList = await db.story.findMany({
      include: {
        photos: {
          include: { categories: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = storiesList.map((story) => ({
      ...story,
      photos: story.photos.map((p) => ({
        ...p,
        category: p.categories.map((c) => c.name).join(','),
      })),
    }))

    return c.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get admin stories error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

stories.post('/admin/stories', async (c) => {
  try {
    const body = await c.req.json()
    const validated = CreateStorySchema.parse(body)

    const story = await db.story.create({
      data: {
        title: validated.title,
        content: validated.content,
        isPublished: validated.isPublished,
        photos: validated.photoIds
          ? {
              connect: validated.photoIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        photos: {
          include: { categories: true },
        },
      },
    })

    const data = {
      ...story,
      photos: story.photos.map((p) => ({
        ...p,
        category: p.categories.map((c) => c.name).join(','),
      })),
    }

    return c.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Create story error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

stories.patch('/admin/stories/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validated = UpdateStorySchema.parse(body)

    const story = await db.story.update({
      where: { id },
      data: validated,
      include: {
        photos: {
          include: { categories: true },
        },
      },
    })

    const data = {
      ...story,
      photos: story.photos.map((p) => ({
        ...p,
        category: p.categories.map((c) => c.name).join(','),
      })),
    }

    return c.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Update story error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

stories.delete('/admin/stories/:id', async (c) => {
  try {
    const id = c.req.param('id')

    await db.story.delete({
      where: { id },
    })

    return c.json({
      success: true,
      message: 'Story deleted successfully',
    })
  } catch (error) {
    console.error('Delete story error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Add photos to story
stories.post('/admin/stories/:id/photos', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validated = AddPhotosSchema.parse(body)

    const story = await db.story.update({
      where: { id },
      data: {
        photos: {
          connect: validated.photoIds.map((photoId) => ({ id: photoId })),
        },
      },
      include: {
        photos: {
          include: { categories: true },
        },
      },
    })

    const data = {
      ...story,
      photos: story.photos.map((p) => ({
        ...p,
        category: p.categories.map((c) => c.name).join(','),
      })),
    }

    return c.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Add photos to story error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Remove photo from story
stories.delete('/admin/stories/:storyId/photos/:photoId', async (c) => {
  try {
    const storyId = c.req.param('storyId')
    const photoId = c.req.param('photoId')

    const story = await db.story.update({
      where: { id: storyId },
      data: {
        photos: {
          disconnect: { id: photoId },
        },
      },
      include: {
        photos: {
          include: { categories: true },
        },
      },
    })

    const data = {
      ...story,
      photos: story.photos.map((p) => ({
        ...p,
        category: p.categories.map((c) => c.name).join(','),
      })),
    }

    return c.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Remove photo from story error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default stories
