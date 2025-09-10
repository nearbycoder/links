import { ExternalLink, Edit, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'

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

interface LinkListProps {
  links: Link[]
  onEdit: (link: Link) => void
  onDelete: (linkId: string) => void
}

export function LinkList({ links, onEdit, onDelete }: LinkListProps) {
  const handleClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id} className="group">
              <TableCell>
                <div className="flex items-center gap-3">
                  {link.favicon && (
                    <img
                      src={link.favicon}
                      alt=""
                      className="w-4 h-4 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => handleClick(link.url)}
                      className="font-medium text-left hover:text-primary transition-colors truncate block w-full"
                      title={link.title}
                    >
                      {link.title}
                    </button>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate" title={link.url}>
                        {new URL(link.url).hostname}
                      </span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className="text-sm text-muted-foreground line-clamp-2"
                  title={link.description}
                >
                  {link.description || 'No description'}
                </span>
              </TableCell>
              <TableCell>
                {link.category ? (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: link.category.color + '20',
                      color: link.category.color,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: link.category.color }}
                    />
                    {link.category.name}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No category
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {link.tags.slice(0, 2).map(({ tag }) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: tag.color + '40',
                        color: tag.color,
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full mr-1"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </Badge>
                  ))}
                  {link.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{link.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(link.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(link)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(link.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
