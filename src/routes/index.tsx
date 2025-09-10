import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { getSession } from '@/lib/auth'
import { authClient } from '@/lib/auth-client'
import { ThemeToggle } from '@/components/theme-toggle'

const getServerSession = createServerFn({
  method: 'GET',
}).handler(async () => await getSession())

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const data = await getServerSession()

    return data
  },
})

function App() {
  const data = Route.useLoaderData()
  const router = useRouter()

  return (
    <div>
      <header className="flex gap-4 justify-center items-center p-4">
        <Link to="/">Home</Link>
        {data?.user ? (
          <>
            <button
              className="cursor-pointer"
              onClick={() => {
                authClient.signOut()
                router.navigate({ to: '/auth/login' })
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/auth/login">Login</Link>
            <Link to="/auth/sign-up">Register</Link>
          </>
        )}
        <ThemeToggle />
      </header>
    </div>
  )
}
