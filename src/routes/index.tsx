import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useState } from 'react'
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  Heart,
  Search,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { getSession } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const getServerSession = createServerFn({
  method: 'GET',
}).handler(async () => await getSession())

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const data = await getServerSession()

    if (!data?.user) {
      throw redirect({ to: '/auth/login' })
    }

    return data
  },
})

interface Link {
  id: string
  title: string
  url: string
  description?: string
  favicon?: string
  isFavorite: boolean
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

function App() {
  const data = Route.useLoaderData()
  const [searchQuery, setSearchQuery] = useState('')
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  )
  const queryClient = useQueryClient()

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({
      linkId,
      isFavorite,
    }: {
      linkId: string
      isFavorite: boolean
    }) => {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite }),
      })
      if (!response.ok) throw new Error('Failed to update favorite status')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-links'] })
      queryClient.invalidateQueries({ queryKey: ['all-links'] })
    },
  })

  const handleToggleFavorite = (linkId: string, isFavorite: boolean) => {
    toggleFavoriteMutation.mutate({ linkId, isFavorite })
  }

  // Fetch favorite links
  const { data: favoriteLinks = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorite-links'],
    queryFn: async () => {
      const response = await fetch('/api/links?favoritesOnly=true')
      if (!response.ok) throw new Error('Failed to fetch favorite links')
      return response.json()
    },
    enabled: !!data.user,
  })

  // Fetch all links
  const { data: allLinks = [], isLoading: allLinksLoading } = useQuery({
    queryKey: ['all-links'],
    queryFn: async () => {
      const response = await fetch('/api/links')
      if (!response.ok) throw new Error('Failed to fetch links')
      return response.json()
    },
    enabled: !!data.user,
  })

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      return response.json()
    },
    enabled: !!data.user,
  })

  // Filter favorite links based on search query
  const filteredFavoriteLinks = favoriteLinks.filter((link: Link) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      link.title.toLowerCase().includes(query) ||
      link.description?.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query) ||
      link.category?.name.toLowerCase().includes(query) ||
      link.tags.some(({ tag }) => tag.name.toLowerCase().includes(query))
    )
  })

  // Organize links by category
  const linksByCategory = categories.map((category: Category) => {
    const categoryLinks = allLinks.filter(
      (link: Link) => link.category?.id === category.id,
    )
    return {
      category,
      links: categoryLinks,
    }
  })

  // Filter links within each category based on search query
  const filteredLinksByCategory = linksByCategory.map(
    ({ category, links }: { category: Category; links: Array<Link> }) => {
      if (!categorySearchQuery) {
        return { category, links, hasMatches: links.length > 0 }
      }

      const query = categorySearchQuery.toLowerCase()
      const filteredLinks = links.filter(
        (link: Link) =>
          link.title.toLowerCase().includes(query) ||
          link.description?.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          link.tags.some(({ tag }) => tag.name.toLowerCase().includes(query)),
      )

      const hasMatches =
        filteredLinks.length > 0 || category.name.toLowerCase().includes(query)

      return {
        category,
        links: filteredLinks,
        hasMatches,
      }
    },
  )

  // Auto-expand categories that have search results
  const categoriesWithMatches = filteredLinksByCategory
    .filter(({ hasMatches }: { hasMatches: boolean }) => hasMatches)
    .map(({ category }: { category: Category }) => category.id)

  // Update expanded categories when search changes
  React.useEffect(() => {
    if (categorySearchQuery && categoriesWithMatches.length > 0) {
      setExpandedCategories(new Set(categoriesWithMatches))
    } else if (!categorySearchQuery) {
      // Collapse all when search is cleared
      setExpandedCategories(new Set())
    }
  }, [categorySearchQuery, categoriesWithMatches.join(',')])

  const handleClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Favorite Links Section */}
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-current" />
              <h2 className="text-2xl font-semibold">Your Favorite Links</h2>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {favoritesLoading ? (
            <div className="text-center py-8">
              Loading your favorite links...
            </div>
          ) : favoriteLinks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No favorite links yet. Start by adding some links and marking
                  them as favorites!
                </p>
              </CardContent>
            </Card>
          ) : filteredFavoriteLinks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No favorite links match your search. Try a different search
                  term.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredFavoriteLinks.map((link: Link) => (
                <div
                  key={link.id}
                  className="group hover:bg-muted/30 transition-all duration-200 border border-border/30 hover:border-border rounded-lg p-3 cursor-pointer"
                  onClick={() => handleClick(link.url)}
                >
                  <div className="flex items-center gap-3">
                    {/* Favicon with fallback */}
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {link.favicon ? (
                        <img
                          src={link.favicon}
                          alt=""
                          className="w-3 h-3 rounded-sm"
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
                      <ExternalLink
                        className={`h-3 w-3 text-gray-600 dark:text-gray-400 ${link.favicon ? 'hidden favicon-fallback' : ''}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium cursor-pointer hover:text-primary transition-colors truncate"
                        title={link.title}
                      >
                        {link.title}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate" title={link.url}>
                          {new URL(link.url).hostname}
                        </span>
                      </div>
                      {link.description && (
                        <p
                          className="text-xs text-muted-foreground line-clamp-1 cursor-pointer hover:text-foreground transition-colors mt-1"
                          title={link.description}
                        >
                          {link.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Category */}
                      {link.category && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0.5 h-5"
                          style={{
                            backgroundColor: link.category.color + '15',
                            color: link.category.color,
                            borderColor: link.category.color + '30',
                          }}
                        >
                          <div
                            className="w-1 h-1 rounded-full mr-1"
                            style={{ backgroundColor: link.category.color }}
                          />
                          {link.category.name}
                        </Badge>
                      )}

                      {/* Tags */}
                      {link.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {link.tags.slice(0, 1).map(({ tag }) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="text-xs px-1.5 py-0.5 h-5"
                              style={{
                                borderColor: tag.color + '40',
                                color: tag.color,
                                backgroundColor: tag.color + '08',
                              }}
                            >
                              <div
                                className="w-1 h-1 rounded-full mr-1"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                            </Badge>
                          ))}
                          {link.tags.length > 1 && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0.5 h-5"
                            >
                              +{link.tags.length - 1}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-2.5 w-2.5" />
                        <span>
                          {formatDistanceToNow(new Date(link.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      {/* Unfavorite Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleFavorite(link.id, false)
                        }}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                        title="Remove from favorites"
                      >
                        <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Categories Section */}
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-500" />
              <h2 className="text-2xl font-semibold">Links by Category</h2>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search categories..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {categoriesLoading || allLinksLoading ? (
            <div className="text-center py-8">
              Loading categories and links...
            </div>
          ) : filteredLinksByCategory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No categorized links yet. Add some links and assign them to
                  categories!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredLinksByCategory.map(
                ({
                  category,
                  links,
                }: {
                  category: Category
                  links: Array<Link>
                  hasMatches: boolean
                }) => (
                  <Collapsible
                    key={category.id}
                    open={expandedCategories.has(category.id)}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <h3 className="text-xl font-semibold">
                            {category.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {links.length} link{links.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2">
                      <div className="pl-7 space-y-2">
                        {links.length === 0 ? (
                          <div className="py-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              {categorySearchQuery
                                ? `No links in "${category.name}" match your search.`
                                : `No links in "${category.name}" yet.`}
                            </p>
                          </div>
                        ) : (
                          links.map((link: Link) => (
                            <div
                              key={link.id}
                              className="group hover:bg-muted/30 transition-all duration-200 border border-border/30 hover:border-border rounded-lg p-3 cursor-pointer"
                              onClick={() => handleClick(link.url)}
                            >
                              <div className="flex items-center gap-3">
                                {/* Favicon with fallback */}
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                  {link.favicon ? (
                                    <img
                                      src={link.favicon}
                                      alt=""
                                      className="w-3 h-3 rounded-sm"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        const fallback =
                                          e.currentTarget.parentElement?.querySelector(
                                            '.favicon-fallback',
                                          )
                                        if (fallback)
                                          fallback.classList.remove('hidden')
                                      }}
                                    />
                                  ) : null}
                                  <ExternalLink
                                    className={`h-3 w-3 text-gray-600 dark:text-gray-400 ${link.favicon ? 'hidden favicon-fallback' : ''}`}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div
                                    className="text-sm font-medium cursor-pointer hover:text-primary transition-colors truncate"
                                    title={link.title}
                                  >
                                    {link.title}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                                    <span className="truncate" title={link.url}>
                                      {new URL(link.url).hostname}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {/* Tags */}
                                  {link.tags.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      {link.tags.slice(0, 1).map(({ tag }) => (
                                        <Badge
                                          key={tag.id}
                                          variant="outline"
                                          className="text-xs px-1.5 py-0.5 h-5"
                                          style={{
                                            borderColor: tag.color + '40',
                                            color: tag.color,
                                            backgroundColor: tag.color + '08',
                                          }}
                                        >
                                          <div
                                            className="w-1 h-1 rounded-full mr-1"
                                            style={{
                                              backgroundColor: tag.color,
                                            }}
                                          />
                                          {tag.name}
                                        </Badge>
                                      ))}
                                      {link.tags.length > 1 && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs px-1.5 py-0.5 h-5"
                                        >
                                          +{link.tags.length - 1}
                                        </Badge>
                                      )}
                                    </div>
                                  )}

                                  {/* Timestamp */}
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-2.5 w-2.5" />
                                    <span>
                                      {formatDistanceToNow(
                                        new Date(link.createdAt),
                                        {
                                          addSuffix: true,
                                        },
                                      )}
                                    </span>
                                  </div>

                                  {/* Favorite Button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleToggleFavorite(
                                        link.id,
                                        !link.isFavorite,
                                      )
                                    }}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                                    title={
                                      link.isFavorite
                                        ? 'Remove from favorites'
                                        : 'Add to favorites'
                                    }
                                  >
                                    <Heart
                                      className={`h-3 w-3 ${link.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                                    />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
