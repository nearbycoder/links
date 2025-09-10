import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().optional(),
})

type TagFormData = z.infer<typeof tagSchema>

interface TagFormProps {
  onSuccess: () => void
  tag?: {
    id: string
    name: string
    color: string
  } // For editing existing tags
}

const defaultColors = [
  '#6b7280', // gray
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
]

export function TagForm({ onSuccess, tag }: TagFormProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: tag?.name || '',
      color: tag?.color || defaultColors[0],
    },
  })

  const onSubmit = async (data: TagFormData) => {
    try {
      const url = tag ? `/api/tags/${tag.id}` : '/api/tags'
      const method = tag ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save tag')
      }

      toast.success(
        tag ? 'Tag updated successfully' : 'Tag created successfully',
      )
      setOpen(false)
      form.reset()
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save tag')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={tag ? 'ghost' : 'default'}
          size={tag ? 'sm' : 'default'}
          className={tag ? 'h-6 w-6 p-0 bg-background border' : ''}
        >
          {tag ? (
            <Edit className="h-3 w-3" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tag ? 'Edit Tag' : 'Add New Tag'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tag name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        type="color"
                        {...field}
                        className="w-20 h-10 p-1 border rounded"
                      />
                      <div className="flex flex-wrap gap-2">
                        {defaultColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 ${
                              field.value === color
                                ? 'border-gray-900'
                                : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{tag ? 'Update Tag' : 'Create Tag'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
