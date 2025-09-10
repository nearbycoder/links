import { Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CategoryForm } from './category-form'
import { DeleteModal } from './delete-modal'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  description?: string
  color: string
}

interface CategoryCardProps {
  category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
  const queryClient = useQueryClient()

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete category')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['links'] })
      toast.success('Category deleted successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete category',
      )
    },
  })

  const handleDelete = () => {
    deleteCategoryMutation.mutate(category.id)
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
          </CardTitle>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CategoryForm
              category={category}
              onSuccess={() =>
                queryClient.invalidateQueries({ queryKey: ['categories'] })
              }
            />
            <DeleteModal
              title="Delete Category"
              description={`Are you sure you want to delete the category "${category.name}"? This will remove it from all associated links.`}
              onConfirm={handleDelete}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {category.description && (
          <p className="text-sm text-muted-foreground">
            {category.description}
          </p>
        )}
        <div className="mt-2">
          <Badge
            variant="secondary"
            className="text-xs"
            style={{
              backgroundColor: category.color + '20',
              color: category.color,
            }}
          >
            <div
              className="w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
