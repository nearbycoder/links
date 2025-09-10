import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { getSession } from '@/lib/auth'

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
    <div className="p-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to Link Manager</h1>
        <p className="text-lg text-muted-foreground">
          Organize and manage your bookmarks with categories and tags
        </p>
        {data?.user ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Welcome back, {data.user.name}!
            </p>
            <p className="text-sm">
              Use the sidebar to navigate between Links, Categories, and Tags.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Please log in to access your bookmarks.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
