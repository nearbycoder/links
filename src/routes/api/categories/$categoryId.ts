import { createServerFileRoute } from '@tanstack/react-start/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
})

export const ServerRoute = createServerFileRoute(
  '/api/categories/$categoryId',
).methods({
  PUT: async ({ params, request }) => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    try {
      const body = await request.json()
      const validatedData = updateCategorySchema.parse(body)

      // Check if category exists and belongs to user
      const existingCategory = await db.category.findFirst({
        where: {
          id: params.categoryId,
          userId: session.user.id,
        },
      })

      if (!existingCategory) {
        return new Response('Category not found', { status: 404 })
      }

      // If name is being updated, check for uniqueness
      if (validatedData.name && validatedData.name !== existingCategory.name) {
        const duplicateCategory = await db.category.findUnique({
          where: {
            userId_name: {
              userId: session.user.id,
              name: validatedData.name,
            },
          },
        })

        if (duplicateCategory) {
          return new Response(
            JSON.stringify({ error: 'Category with this name already exists' }),
            {
              status: 409,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      }

      const category = await db.category.update({
        where: { id: params.categoryId },
        data: validatedData,
      })

      return Response.json(category)
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
      // Check if category exists and belongs to user
      const existingCategory = await db.category.findFirst({
        where: {
          id: params.categoryId,
          userId: session.user.id,
        },
      })

      if (!existingCategory) {
        return new Response('Category not found', { status: 404 })
      }

      await db.category.delete({
        where: { id: params.categoryId },
      })

      return new Response(null, { status: 204 })
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 })
    }
  },
})
