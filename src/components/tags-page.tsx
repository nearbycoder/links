import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { TagForm } from './tag-form'
import { TagCard } from './tag-card'

interface Tag {
  id: string
  name: string
  color: string
}

export function TagsPage() {
  const queryClient = useQueryClient()

  // Fetch tags
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags')
      if (!response.ok) throw new Error('Failed to fetch tags')
      return response.json()
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground">
            Tag your links for better organization
          </p>
        </div>
        <TagForm
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ['tags'] })
          }
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading tags...</div>
      ) : tags.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No tags found. Create your first tag!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: Tag) => (
            <TagCard key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </div>
  )
}
