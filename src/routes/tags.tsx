import { createFileRoute } from '@tanstack/react-router'
import { getSession } from '@/lib/auth'
import { createServerFn } from '@tanstack/react-start'
import { TagsPage } from '@/components/tags-page'

const getServerSession = createServerFn({
  method: 'GET',
}).handler(async () => await getSession())

export const Route = createFileRoute('/tags')({
  component: TagsPage,
  loader: async () => {
    const session = await getServerSession()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }
    return { user: session.user }
  },
})
