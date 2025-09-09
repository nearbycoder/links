import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { getSession } from '@/lib/auth'
import { authClient } from '@/lib/auth-client'

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

  return (
    <div>
      <header className="flex gap-4 justify-center p-4">
        <Link to="/">Home</Link>
        {data?.user ? (
          <>
            <button onClick={() => authClient.signOut()}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/auth/login">Login</Link>
            <Link to="/auth/sign-up">Register</Link>
          </>
        )}
      </header>
    </div>
  )
}
