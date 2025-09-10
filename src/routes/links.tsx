import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { LinksPage } from '@/components/links-page'

const getServerSession = createServerFn({
  method: 'GET',
}).handler(async () => await getSession())

const linksSearchSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
})

export const Route = createFileRoute('/links')({
  component: LinksPage,
  validateSearch: linksSearchSchema,
  loader: async () => {
    const session = await getServerSession()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }
    return { user: session.user }
  },
})
