import { createFileRoute } from '@tanstack/react-router'
import { getSession } from '@/lib/auth'
import { createServerFn } from '@tanstack/react-start'
import { CategoriesPage } from '@/components/categories-page'

const getServerSession = createServerFn({
  method: 'GET',
}).handler(async () => await getSession())

export const Route = createFileRoute('/categories')({
  component: CategoriesPage,
  loader: async () => {
    const session = await getServerSession()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }
    return { user: session.user }
  },
})
