import { createServerFileRoute } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().optional(),
})

export const ServerRoute = createServerFileRoute('/api/tags').methods({
  GET: async () => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const tags = await db.tag.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return Response.json(tags)
  },

  POST: async ({ request }) => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    try {
      const body = await request.json()
      const validatedData = createTagSchema.parse(body)

      // Check if tag with same name already exists for this user
      const existingTag = await db.tag.findUnique({
        where: {
          userId_name: {
            userId: session.user.id,
            name: validatedData.name,
          },
        },
      })

      if (existingTag) {
        return new Response(
          JSON.stringify({ error: 'Tag with this name already exists' }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      const tag = await db.tag.create({
        data: {
          ...validatedData,
          userId: session.user.id,
        },
      })

      return Response.json(tag)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({ errors: error.issues }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('Internal Server Error', { status: 500 })
    }
  },
})
