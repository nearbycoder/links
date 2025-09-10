import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '@/lib/auth'
import { TagsPage } from '@/components/tags-page'

const getServerSession = createServerFn({
  method: 'GET',
}).handler(async () => await getSession())

export const Route = createFileRoute('/tags')({
  component: TagsPage,
  loader: async () => {
    const session = await getServerSession()
    if (!session?.user) {
      throw redirect({ to: '/auth/login' })
    }
    return { user: session.user }
  },
})
