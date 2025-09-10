import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '@/lib/auth'
import { CategoriesPage } from '@/components/categories-page'

const getServerSession = createServerFn({
  method: 'GET',
}).handler(async () => await getSession())

export const Route = createFileRoute('/categories')({
  component: CategoriesPage,
  loader: async () => {
    const session = await getServerSession()
    if (!session?.user) {
      throw redirect({ to: '/auth/login' })
    }
    return { user: session.user }
  },
})
