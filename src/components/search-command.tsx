import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import {
  ExternalLink,
  FolderOpen,
  Home,
  Link as LinkIcon,
  Plus,
  Search,
  Tag,
} from 'lucide-react'
import { SearchLinkForm } from './search-link-form'
import { SearchCategoryForm } from './search-category-form'
import { SearchTagForm } from './search-tag-form'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

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
}

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Category {
  id: string
  name: string
  color: string
}

interface Tag {
  id: string
  name: string
  color: string
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showTagForm, setShowTagForm] = useState(false)

  // Fuzzy matching function for better search
  const fuzzyMatch = (query: string, text: string): boolean => {
    if (!query) return true
    const queryLower = query.toLowerCase()
    const textLower = text.toLowerCase()

    // Exact match
    if (textLower.includes(queryLower)) return true

    // Partial word match (e.g., "cre" matches "create")
    const words = textLower.split(/\s+/)
    if (words.some((word) => word.startsWith(queryLower))) return true

    // Character sequence match (e.g., "cr" matches "create")
    let queryIndex = 0
    for (
      let i = 0;
      i < textLower.length && queryIndex < queryLower.length;
      i++
    ) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++
      }
    }
    return queryIndex === queryLower.length
  }

  // Fetch all links for search
  const { data: links = [] } = useQuery({
    queryKey: ['links', 'search'],
    queryFn: async () => {
      const response = await fetch('/api/links')
      if (!response.ok) throw new Error('Failed to fetch links')
      return response.json()
    },
    enabled: open, // Only fetch when dialog is open
  })

  // Fetch categories and tags for the forms
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      return response.json()
    },
  })

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags')
      if (!response.ok) throw new Error('Failed to fetch tags')
      return response.json()
    },
  })

  // Filter links based on search query
  const filteredLinks = links.filter((link: Link) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      link.title.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query) ||
      (link.description && link.description.toLowerCase().includes(query)) ||
      (link.category && link.category.name.toLowerCase().includes(query)) ||
      link.tags.some(({ tag }) => tag.name.toLowerCase().includes(query))
    )
  })

  const handleSelect = (link: Link) => {
    window.open(link.url, '_blank', 'noopener,noreferrer')
    onOpenChange(false)
    setSearchQuery('')
  }

  const handleCreateAction = (action: 'link' | 'category' | 'tag') => {
    onOpenChange(false)
    setSearchQuery('')

    // Open the appropriate modal
    switch (action) {
      case 'link':
        setShowLinkForm(true)
        break
      case 'category':
        setShowCategoryForm(true)
        break
      case 'tag':
        setShowTagForm(true)
        break
    }
  }

  const handleNavigate = (path: string) => {
    router.navigate({ to: path })
    onOpenChange(false)
    setSearchQuery('')
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onOpenChange(true)
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput
          placeholder="Search links, navigate, or create..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {searchQuery
              ? 'No results found.'
              : 'Start typing to search, navigate, or create...'}
          </CommandEmpty>

          {/* Navigation Actions - Show when no search query or when query matches navigation terms */}
          {(!searchQuery ||
            fuzzyMatch(searchQuery, 'home') ||
            fuzzyMatch(searchQuery, 'links') ||
            fuzzyMatch(searchQuery, 'categories') ||
            fuzzyMatch(searchQuery, 'tags') ||
            fuzzyMatch(searchQuery, 'go to') ||
            fuzzyMatch(searchQuery, 'navigate') ||
            fuzzyMatch(searchQuery, 'dashboard') ||
            fuzzyMatch(searchQuery, 'bookmarks') ||
            fuzzyMatch(searchQuery, 'cat') ||
            fuzzyMatch(searchQuery, 'link')) && (
            <CommandGroup heading="Navigation">
              <CommandItem
                value="go to home"
                onSelect={() => handleNavigate('/')}
                className="flex items-center gap-3 p-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Home className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Go to Home</div>
                    <div className="text-sm text-muted-foreground">
                      Dashboard overview
                    </div>
                  </div>
                </div>
              </CommandItem>

              <CommandItem
                value="go to links"
                onSelect={() => handleNavigate('/links')}
                className="flex items-center gap-3 p-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Go to Links</div>
                    <div className="text-sm text-muted-foreground">
                      View all bookmarks
                    </div>
                  </div>
                </div>
              </CommandItem>

              <CommandItem
                value="go to categories"
                onSelect={() => handleNavigate('/categories')}
                className="flex items-center gap-3 p-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <FolderOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Go to Categories</div>
                    <div className="text-sm text-muted-foreground">
                      Manage categories
                    </div>
                  </div>
                </div>
              </CommandItem>

              <CommandItem
                value="go to tags"
                onSelect={() => handleNavigate('/tags')}
                className="flex items-center gap-3 p-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                    <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Go to Tags</div>
                    <div className="text-sm text-muted-foreground">
                      Manage tags
                    </div>
                  </div>
                </div>
              </CommandItem>
            </CommandGroup>
          )}

          {/* Create Actions - Show when no search query or when query matches create actions */}
          {(!searchQuery ||
            fuzzyMatch(searchQuery, 'new') ||
            fuzzyMatch(searchQuery, 'create') ||
            fuzzyMatch(searchQuery, 'add') ||
            fuzzyMatch(searchQuery, 'link') ||
            fuzzyMatch(searchQuery, 'category') ||
            fuzzyMatch(searchQuery, 'tag') ||
            fuzzyMatch(searchQuery, 'bookmark') ||
            fuzzyMatch(searchQuery, 'plus') ||
            fuzzyMatch(searchQuery, 'cat') ||
            fuzzyMatch(searchQuery, 'bookmarks')) && (
            <CommandGroup heading="Create">
              <CommandItem
                value="create new link"
                onSelect={() => handleCreateAction('link')}
                className="flex items-center gap-3 p-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Create New Link</div>
                    <div className="text-sm text-muted-foreground">
                      Add a new bookmark
                    </div>
                  </div>
                </div>
              </CommandItem>

              <CommandItem
                value="create new category"
                onSelect={() => handleCreateAction('category')}
                className="flex items-center gap-3 p-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Create New Category</div>
                    <div className="text-sm text-muted-foreground">
                      Organize your links
                    </div>
                  </div>
                </div>
              </CommandItem>

              <CommandItem
                value="create new tag"
                onSelect={() => handleCreateAction('tag')}
                className="flex items-center gap-3 p-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                    <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Create New Tag</div>
                    <div className="text-sm text-muted-foreground">
                      Tag your links
                    </div>
                  </div>
                </div>
              </CommandItem>
            </CommandGroup>
          )}

          {/* Search Results */}
          {filteredLinks.length > 0 && (
            <CommandGroup heading="Links">
              {filteredLinks.map((link: Link) => (
                <CommandItem
                  key={link.id}
                  value={`${link.title} ${link.url} ${link.description || ''} ${link.category?.name || ''} ${link.tags.map((t) => t.tag.name).join(' ')}`}
                  onSelect={() => handleSelect(link)}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Favicon with fallback */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {link.favicon ? (
                        <img
                          src={link.favicon}
                          alt=""
                          className="w-4 h-4 rounded-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback =
                              e.currentTarget.parentElement?.querySelector(
                                '.favicon-fallback',
                              )
                            if (fallback) fallback.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <LinkIcon
                        className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${link.favicon ? 'hidden favicon-fallback' : ''}`}
                      />
                    </div>

                    {/* Link content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{link.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {link.url}
                      </div>
                      {link.description && (
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {link.description}
                        </div>
                      )}

                      {/* Metadata row */}
                      <div className="flex items-center gap-2 mt-1">
                        {link.category && (
                          <div className="flex items-center gap-1">
                            <FolderOpen
                              className="h-3 w-3"
                              style={{ color: link.category.color }}
                            />
                            <span
                              className="text-xs font-medium"
                              style={{ color: link.category.color }}
                            >
                              {link.category.name}
                            </span>
                          </div>
                        )}
                        {link.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {link.tags.length} tag
                              {link.tags.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* External link indicator */}
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      {/* Form Modals */}
      <SearchLinkForm
        open={showLinkForm}
        onOpenChange={setShowLinkForm}
        categories={categories}
        tags={tags}
        onSuccess={() => {
          setShowLinkForm(false)
          // Optionally refresh the search results
        }}
      />

      <SearchCategoryForm
        open={showCategoryForm}
        onOpenChange={setShowCategoryForm}
        onSuccess={() => {
          setShowCategoryForm(false)
          // Optionally refresh the search results
        }}
      />

      <SearchTagForm
        open={showTagForm}
        onOpenChange={setShowTagForm}
        onSuccess={() => {
          setShowTagForm(false)
          // Optionally refresh the search results
        }}
      />
    </>
  )
}
