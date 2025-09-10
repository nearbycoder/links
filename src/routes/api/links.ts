import { createServerFileRoute } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

const createLinkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Invalid URL'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})

export const ServerRoute = createServerFileRoute('/api/links').methods({
  GET: async ({ request }) => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const categoryId = url.searchParams.get('categoryId')
    const tagId = url.searchParams.get('tagId')
    const favoritesOnly = url.searchParams.get('favoritesOnly') === 'true'

    const links = await db.link.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { url: { contains: search } },
          ],
        }),
        ...(categoryId && { categoryId }),
        ...(tagId && {
          tags: {
            some: {
              tagId,
            },
          },
        }),
        ...(favoritesOnly && { isFavorite: true }),
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return Response.json(links)
  },

  POST: async ({ request }) => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    try {
      const body = await request.json()
      const validatedData = createLinkSchema.parse(body)

      // Validate category belongs to user if provided
      if (validatedData.categoryId) {
        const category = await db.category.findFirst({
          where: {
            id: validatedData.categoryId,
            userId: session.user.id,
          },
        })

        if (!category) {
          return new Response(
            JSON.stringify({
              error: 'Category not found or does not belong to user',
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      }

      // Validate tags belong to user if provided
      if (validatedData.tagIds && validatedData.tagIds.length > 0) {
        const tags = await db.tag.findMany({
          where: {
            id: { in: validatedData.tagIds },
            userId: session.user.id,
          },
        })

        if (tags.length !== validatedData.tagIds.length) {
          return new Response(
            JSON.stringify({
              error: 'One or more tags not found or do not belong to user',
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      }

      // Extract favicon URL from the website
      let favicon = null
      try {
        const domain = new URL(validatedData.url).origin
        favicon = `${domain}/favicon.ico`
      } catch {
        // Ignore favicon extraction errors
      }

      const link = await db.link.create({
        data: {
          title: validatedData.title,
          url: validatedData.url,
          description: validatedData.description,
          favicon,
          categoryId: validatedData.categoryId,
          userId: session.user.id,
          ...(validatedData.tagIds && {
            tags: {
              create: validatedData.tagIds.map((tagId) => ({
                tagId,
              })),
            },
          }),
        },
        include: {
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      })

      return Response.json(link)
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
