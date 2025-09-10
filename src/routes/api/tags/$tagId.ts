import { createServerFileRoute } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

const updateTagSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  color: z.string().optional(),
})

export const ServerRoute = createServerFileRoute('/api/tags/$tagId').methods({
  PUT: async ({ params, request }) => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    try {
      const body = await request.json()
      const validatedData = updateTagSchema.parse(body)

      // Check if tag exists and belongs to user
      const existingTag = await db.tag.findFirst({
        where: {
          id: params.tagId,
          userId: session.user.id,
        },
      })

      if (!existingTag) {
        return new Response('Tag not found', { status: 404 })
      }

      // If name is being updated, check for uniqueness
      if (validatedData.name && validatedData.name !== existingTag.name) {
        const duplicateTag = await db.tag.findUnique({
          where: {
            userId_name: {
              userId: session.user.id,
              name: validatedData.name,
            },
          },
        })

        if (duplicateTag) {
          return new Response(
            JSON.stringify({ error: 'Tag with this name already exists' }),
            {
              status: 409,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      }

      const tag = await db.tag.update({
        where: { id: params.tagId },
        data: validatedData,
      })

      return Response.json(tag)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({ errors: error.errors }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('Internal Server Error', { status: 500 })
    }
  },

  DELETE: async ({ params }) => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    try {
      // Check if tag exists and belongs to user
      const existingTag = await db.tag.findFirst({
        where: {
          id: params.tagId,
          userId: session.user.id,
        },
      })

      if (!existingTag) {
        return new Response('Tag not found', { status: 404 })
      }

      await db.tag.delete({
        where: { id: params.tagId },
      })

      return new Response(null, { status: 204 })
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 })
    }
  },
})
