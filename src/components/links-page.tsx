import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Grid, List, Search } from 'lucide-react'
import { LinkForm } from './link-form'
import { LinkCard } from './link-card'
import { LinkList } from './link-list'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Link {
  id: string
  title: string
  url: string
  description?: string
  favicon?: string
  category?: {
    id: string
    name: string
    color: string
  }
  tags: Array<{
    tag: {
      id: string
      name: string
      color: string
    }
  }>
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  description?: string
  color: string
}

interface Tag {
  id: string
  name: string
  color: string
}

export function LinksPage() {
  const search = useSearch({ from: '/links' })
  const navigate = useNavigate({ from: '/links' })

  const searchQuery = search.search || ''
  const selectedCategory = search.category || ''
  const selectedTag = search.tag || ''

  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>(
    'links-view-mode',
    'grid',
  )
  const [editingLink, setEditingLink] = useState<Link | null>(null)

  const queryClient = useQueryClient()

  // Update URL parameters when search/filter values change
  const updateSearchParams = (updates: {
    search?: string
    category?: string
    tag?: string
  }) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...updates,
      }),
      replace: true,
    })
  }

  // Fetch links
  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ['links', searchQuery, selectedCategory, selectedTag],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (
        selectedCategory &&
        selectedCategory !== 'all' &&
        selectedCategory !== ''
      )
        params.append('categoryId', selectedCategory)
      if (selectedTag && selectedTag !== 'all' && selectedTag !== '')
        params.append('tagId', selectedTag)

      const response = await fetch(`/api/links?${params}`)
      if (!response.ok) throw new Error('Failed to fetch links')
      return response.json()
    },
  })

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      return response.json()
    },
  })

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags')
      if (!response.ok) throw new Error('Failed to fetch tags')
      return response.json()
    },
  })

  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete link')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
    },
  })

  const handleDeleteLink = (linkId: string) => {
    if (confirm('Are you sure you want to delete this link?')) {
      deleteLinkMutation.mutate(linkId)
    }
  }

  const handleEditLink = (link: Link) => {
    setEditingLink(link)
  }

  const handleEditSuccess = () => {
    setEditingLink(null)
    queryClient.invalidateQueries({ queryKey: ['links'] })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Link Manager</h1>
          <p className="text-muted-foreground">
            Organize and manage your bookmarks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={
              viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''
            }
            title={`Current: ${viewMode}, Grid button active: ${viewMode === 'grid'}`}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''
            }
            title={`Current: ${viewMode}, List button active: ${viewMode === 'list'}`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search links..."
                  value={searchQuery}
                  onChange={(e) =>
                    updateSearchParams({ search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={(value) =>
                  updateSearchParams({ category: value })
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedTag}
                onValueChange={(value) => updateSearchParams({ tag: value })}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {tags.map((tag: Tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Add Link Button */}
        <div className="flex justify-end">
          <LinkForm
            categories={categories}
            tags={tags}
            onSuccess={() =>
              queryClient.invalidateQueries({ queryKey: ['links'] })
            }
          />
        </div>

        {/* Links Display */}
        {linksLoading ? (
          <div className="text-center py-8">Loading links...</div>
        ) : links.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No links found. Add your first link!
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link: Link) => (
              <LinkCard
                key={link.id}
                link={link}
                onDelete={() => handleDeleteLink(link.id)}
                onEdit={() => handleEditLink(link)}
              />
            ))}
          </div>
        ) : (
          <LinkList
            links={links}
            onDelete={handleDeleteLink}
            onEdit={handleEditLink}
          />
        )}
      </div>

      {/* Edit Link Modal */}
      {editingLink && (
        <LinkForm
          categories={categories}
          tags={tags}
          link={editingLink}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
