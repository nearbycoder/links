import {
  Calendar,
  Edit,
  ExternalLink,
  Heart,
  Link as LinkIcon,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { DeleteModal } from './delete-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

interface LinkCardProps {
  link: Link
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite?: (linkId: string, isFavorite: boolean) => void
}

export function LinkCard({
  link,
  onEdit,
  onDelete,
  onToggleFavorite,
}: LinkCardProps) {
  const handleClick = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border min-w-80">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Favicon with fallback */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
              {link.favicon ? (
                <img
                  src={link.favicon}
                  alt=""
                  className="w-5 h-5 rounded-sm"
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
                className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${link.favicon ? 'hidden favicon-fallback' : ''}`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle
                className="text-lg cursor-pointer hover:text-primary transition-colors truncate mb-1"
                onClick={handleClick}
                title={link.title}
              >
                {link.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                <span className="truncate" title={link.url}>
                  {new URL(link.url).hostname}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(link.id, !link.isFavorite)
                }}
                className="h-8 w-8 p-0 hover:bg-muted"
                title={
                  link.isFavorite ? 'Remove from favorites' : 'Add to favorites'
                }
              >
                <Heart
                  className={`h-4 w-4 ${link.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <DeleteModal
              title="Delete Link"
              description={`Are you sure you want to delete "${link.title}"? This action cannot be undone.`}
              onConfirm={onDelete}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        {link.description && (
          <p
            className="text-sm text-muted-foreground line-clamp-2 cursor-pointer hover:text-foreground transition-colors"
            onClick={handleClick}
            title={link.description}
          >
            {link.description}
          </p>
        )}

        {/* Category and Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {link.category && (
            <Badge
              variant="secondary"
              className="text-xs font-medium"
              style={{
                backgroundColor: link.category.color + '15',
                color: link.category.color,
                borderColor: link.category.color + '30',
              }}
            >
              <div
                className="w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: link.category.color }}
              />
              {link.category.name}
            </Badge>
          )}

          {link.tags.length > 0 && (
            <>
              {link.tags.slice(0, 3).map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs font-medium"
                  style={{
                    borderColor: tag.color + '40',
                    color: tag.color,
                    backgroundColor: tag.color + '08',
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mr-1.5"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </Badge>
              ))}
              {link.tags.length > 3 && (
                <Badge variant="outline" className="text-xs font-medium">
                  +{link.tags.length - 3} more
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <Calendar className="h-3 w-3" />
          <span>
            Added{' '}
            {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
