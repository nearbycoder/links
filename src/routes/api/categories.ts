import { createServerFileRoute } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
})

export const ServerRoute = createServerFileRoute('/api/categories').methods({
  GET: async () => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const categories = await db.category.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return Response.json(categories)
  },

  POST: async ({ request }) => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    try {
      const body = await request.json()
      const validatedData = createCategorySchema.parse(body)

      // Check if category with same name already exists for this user
      const existingCategory = await db.category.findUnique({
        where: {
          userId_name: {
            userId: session.user.id,
            name: validatedData.name,
          },
        },
      })

      if (existingCategory) {
        return new Response(
          JSON.stringify({ error: 'Category with this name already exists' }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      const category = await db.category.create({
        data: {
          ...validatedData,
          userId: session.user.id,
        },
      })

      return Response.json(category)
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
