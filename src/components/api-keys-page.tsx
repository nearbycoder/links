import { useEffect, useState } from 'react'
import { Copy, Edit, Eye, EyeOff, Key, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { authClient } from '@/lib/auth-client'

interface ApiKey {
  id: string
  name: string | null
  start: string | null
  prefix: string | null
  enabled: boolean
  remaining: number | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
  permissions: Record<string, Array<string>> | null
  metadata: Record<string, any> | null
}

const unsecuredCopyToClipboard = (text: string) => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand('copy')
  } catch (err) {
    console.error('Unable to copy to clipboard', err)
  }
  document.body.removeChild(textArea)
}

/**
 * Copies the text passed as param to the system clipboard
 * Check if using HTTPS and navigator.clipboard is available
 * Then uses standard clipboard API, otherwise uses fallback
 */
const safeCopyToClipboard = (content: string) => {
  if (window.isSecureContext) {
    navigator.clipboard.writeText(content)
  } else {
    unsecuredCopyToClipboard(content)
  }
}

export function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<Array<ApiKey>>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null)
  const [newApiKey, setNewApiKey] = useState({
    name: '',
    expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
    prefix: '',
    permissions: '',
    metadata: '',
  })
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [fullApiKeys, setFullApiKeys] = useState<Record<string, string>>({})

  const loadApiKeys = async () => {
    try {
      setLoading(true)
      const { data, error } = await authClient.apiKey.list()
      if (error) {
        toast.error('Failed to load API keys')
        return
      }
      setApiKeys(data)
    } catch (error) {
      toast.error('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApiKeys()
  }, [])

  const handleCreateApiKey = async () => {
    try {
      const permissions = newApiKey.permissions
        ? JSON.parse(newApiKey.permissions)
        : undefined
      const metadata = newApiKey.metadata
        ? JSON.parse(newApiKey.metadata)
        : undefined

      const { data, error } = await authClient.apiKey.create({
        name: newApiKey.name,
        expiresIn: newApiKey.expiresIn,
        prefix: newApiKey.prefix || undefined,
        permissions,
        metadata,
      })

      if (error) {
        toast.error('Failed to create API key')
        return
      }

      // Store the full API key for copying
      if ('key' in data && data.key) {
        setFullApiKeys((prev) => ({ ...prev, [data.id]: data.key }))
      }

      toast.success('API key created successfully')
      setCreateDialogOpen(false)
      setNewApiKey({
        name: '',
        expiresIn: 30 * 24 * 60 * 60,
        prefix: '',
        permissions: '',
        metadata: '',
      })
      loadApiKeys()
    } catch (error) {
      toast.error('Failed to create API key')
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      const { error } = await authClient.apiKey.delete({ keyId })
      if (error) {
        toast.error('Failed to delete API key')
        return
      }

      toast.success('API key deleted successfully')
      loadApiKeys()
    } catch (error) {
      toast.error('Failed to delete API key')
    }
  }

  const handleUpdateApiKey = async () => {
    if (!selectedApiKey) return

    try {
      const { error } = await authClient.apiKey.update({
        keyId: selectedApiKey.id,
        name: selectedApiKey.name || undefined,
      })

      if (error) {
        toast.error('Failed to update API key')
        return
      }

      toast.success('API key updated successfully')
      setEditDialogOpen(false)
      setSelectedApiKey(null)
      loadApiKeys()
    } catch (error) {
      toast.error('Failed to update API key')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await safeCopyToClipboard(text)
      toast.success('API key copied to clipboard')
    } catch (error) {
      console.error(error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId)
    } else {
      newVisibleKeys.add(keyId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatExpiration = (expiresAt: Date | null) => {
    if (!expiresAt) return 'Never'
    const now = new Date()
    const diff = expiresAt.getTime() - now.getTime()

    if (diff < 0) return 'Expired'

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return `${days} days remaining`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading API keys...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for programmatic access
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for programmatic access to your account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newApiKey.name}
                  onChange={(e) =>
                    setNewApiKey({ ...newApiKey, name: e.target.value })
                  }
                  placeholder="My API Key"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiresIn">Expires In</Label>
                <Select
                  value={newApiKey.expiresIn.toString()}
                  onValueChange={(value) =>
                    setNewApiKey({ ...newApiKey, expiresIn: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="86400">1 day</SelectItem>
                    <SelectItem value="604800">1 week</SelectItem>
                    <SelectItem value="2592000">1 month</SelectItem>
                    <SelectItem value="7776000">3 months</SelectItem>
                    <SelectItem value="31536000">1 year</SelectItem>
                    <SelectItem value="94608000">3 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prefix">Prefix (optional)</Label>
                <Input
                  id="prefix"
                  value={newApiKey.prefix}
                  onChange={(e) =>
                    setNewApiKey({ ...newApiKey, prefix: e.target.value })
                  }
                  placeholder="my-app"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="permissions">
                  Permissions (JSON, optional)
                </Label>
                <Textarea
                  id="permissions"
                  value={newApiKey.permissions}
                  onChange={(e) =>
                    setNewApiKey({ ...newApiKey, permissions: e.target.value })
                  }
                  placeholder='{"files": ["read", "write"]}'
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="metadata">Metadata (JSON, optional)</Label>
                <Textarea
                  id="metadata"
                  value={newApiKey.metadata}
                  onChange={(e) =>
                    setNewApiKey({ ...newApiKey, metadata: e.target.value })
                  }
                  placeholder='{"description": "API key for mobile app"}'
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateApiKey} disabled={!newApiKey.name}>
                Create API Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API keys found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first API key to get started with programmatic access.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">
                        {apiKey.name || 'Unnamed API Key'}
                      </CardTitle>
                      <CardDescription>
                        Created {formatDate(apiKey.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={apiKey.enabled ? 'default' : 'secondary'}>
                      {apiKey.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedApiKey(apiKey)
                          setEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "
                              {apiKey.name || 'Unnamed API Key'}"? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteApiKey(apiKey.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                        {visibleKeys.has(apiKey.id)
                          ? fullApiKeys[apiKey.id] ||
                            `${apiKey.prefix || 'key'}_${apiKey.start || '****'}...`
                          : '••••••••••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const fullKey = fullApiKeys[apiKey.id]

                          if (fullKey) {
                            copyToClipboard(fullKey)
                          } else {
                            toast.error(
                              'Full API key not available. Please create a new key.',
                            )
                          }
                        }}
                        title={
                          fullApiKeys[apiKey.id]
                            ? 'Copy full API key'
                            : 'Full key not available'
                        }
                      >
                        <Copy
                          className={`h-4 w-4 ${fullApiKeys[apiKey.id] ? 'text-green-600' : 'text-muted-foreground'}`}
                        />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Expires</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatExpiration(apiKey.expiresAt)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Remaining</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {apiKey.remaining !== null
                        ? apiKey.remaining
                        : 'Unlimited'}
                    </p>
                  </div>
                </div>
                {apiKey.permissions && (
                  <div>
                    <Label className="text-sm font-medium">Permissions</Label>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(apiKey.permissions, null, 2)}
                    </pre>
                  </div>
                )}
                {apiKey.metadata && (
                  <div>
                    <Label className="text-sm font-medium">Metadata</Label>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(apiKey.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
            <DialogDescription>
              Update the name of your API key.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={selectedApiKey?.name || ''}
                onChange={(e) =>
                  setSelectedApiKey((prev) =>
                    prev ? { ...prev, name: e.target.value } : null,
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateApiKey}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
