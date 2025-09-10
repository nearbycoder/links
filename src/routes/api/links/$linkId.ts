import { createServerFileRoute } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

const updateLinkSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  url: z.string().url('Invalid URL').optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
})

export const ServerRoute = createServerFileRoute('/api/links/$linkId').methods({
  GET: async ({ params }) => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const link = await db.link.findFirst({
      where: {
        id: params.linkId,
        userId: session.user.id,
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

    if (!link) {
      return new Response('Link not found', { status: 404 })
    }

    return Response.json(link)
  },

  PUT: async ({ params, request }) => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    try {
      const body = await request.json()
      const validatedData = updateLinkSchema.parse(body)

      // Check if link exists and belongs to user
      const existingLink = await db.link.findFirst({
        where: {
          id: params.linkId,
          userId: session.user.id,
        },
      })

      if (!existingLink) {
        return new Response('Link not found', { status: 404 })
      }

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

      // Extract favicon URL if URL is being updated
      let favicon = existingLink.favicon
      if (validatedData.url) {
        try {
          const domain = new URL(validatedData.url).origin
          favicon = `${domain}/favicon.ico`
        } catch {
          // Keep existing favicon if extraction fails
        }
      }

      // Update link with transaction to handle tags
      const link = await db.$transaction(async (tx) => {
        // Update the link (exclude relation fields)
        const { tagIds, ...linkData } = validatedData

        // Prepare update data, explicitly handling categoryId
        const updateData: any = {
          title: linkData.title,
          url: linkData.url,
          description: linkData.description,
          favicon,
          isFavorite: linkData.isFavorite,
        }

        // Handle categoryId - explicitly set to null if undefined
        if (linkData.categoryId !== undefined) {
          updateData.categoryId = linkData.categoryId
        } else {
          updateData.categoryId = null
        }

        await tx.link.update({
          where: { id: params.linkId },
          data: updateData,
        })

        // Update tags if provided
        if (tagIds !== undefined) {
          // Remove existing tags
          await tx.linkTag.deleteMany({
            where: { linkId: params.linkId },
          })

          // Add new tags
          if (tagIds.length > 0) {
            await tx.linkTag.createMany({
              data: tagIds.map((tagId) => ({
                linkId: params.linkId,
                tagId,
              })),
            })
          }
        }

        // Return the updated link with relations
        return await tx.link.findUnique({
          where: { id: params.linkId },
          include: {
            category: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        })
      })

      return Response.json(link)
    } catch (error) {
      console.error('Error updating link:', error)
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({ errors: error.issues }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  },

  PATCH: async ({ params, request }) => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    try {
      const body = await request.json()
      const { isFavorite } = body

      if (typeof isFavorite !== 'boolean') {
        return new Response(
          JSON.stringify({ error: 'isFavorite must be a boolean' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }

      // Check if link exists and belongs to user
      const existingLink = await db.link.findFirst({
        where: {
          id: params.linkId,
          userId: session.user.id,
        },
      })

      if (!existingLink) {
        return new Response('Link not found', { status: 404 })
      }

      // Update only the isFavorite field
      const link = await db.link.update({
        where: { id: params.linkId },
        data: { isFavorite },
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
      console.error('Error updating link favorite status:', error)
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  },

  DELETE: async ({ params }) => {
    const session = await getSession()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const link = await db.link.findFirst({
      where: {
        id: params.linkId,
        userId: session.user.id,
      },
    })

    if (!link) {
      return new Response('Link not found', { status: 404 })
    }

    await db.link.delete({
      where: { id: params.linkId },
    })

    return new Response(null, { status: 204 })
  },
})
