import { createFileRoute } from '@tanstack/react-router'
import { ApiKeysPage } from '@/components/api-keys-page'

export const Route = createFileRoute('/api-keys')({
  component: ApiKeysPage,
})
