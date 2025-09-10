import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TagForm } from './tag-form'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagCardProps {
  tag: Tag
}

export function TagCard({ tag }: TagCardProps) {
  const queryClient = useQueryClient()

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete tag')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['links'] })
      toast.success('Tag deleted successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete tag',
      )
    },
  })

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete the tag "${tag.name}"? This will remove it from all associated links.`,
      )
    ) {
      deleteTagMutation.mutate(tag.id)
    }
  }

  return (
    <div className="group relative">
      <Badge
        variant="secondary"
        className="flex items-center gap-2 pr-8"
        style={{
          backgroundColor: tag.color + '20',
          color: tag.color,
        }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: tag.color }}
        />
        {tag.name}
      </Badge>
      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          <TagForm
            tag={tag}
            onSuccess={() =>
              queryClient.invalidateQueries({ queryKey: ['tags'] })
            }
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive bg-background border"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
