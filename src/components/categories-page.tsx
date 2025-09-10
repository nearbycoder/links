import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryForm } from './category-form'
import { CategoryCard } from './category-card'

interface Category {
  id: string
  name: string
  description?: string
  color: string
}

export function CategoriesPage() {
  const queryClient = useQueryClient()

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      return response.json()
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Organize your links with categories
          </p>
        </div>
        <CategoryForm
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ['categories'] })
          }
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading categories...</div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No categories found. Create your first category!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category: Category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  )
}
