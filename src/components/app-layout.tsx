import { Search } from 'lucide-react'
import { AppSidebar } from './app-sidebar'
import { ThemeToggle } from './theme-toggle'
import { SearchProvider, useSearch } from './search-provider'
import { Toaster } from '@/components/ui/sonner'

import {
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

interface AppLayoutProps {
  children: React.ReactNode
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const { openSearch } = useSearch()

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarRail />
      <Toaster />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold">Link Manager</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openSearch}
              className="hidden sm:flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openSearch}
              className="sm:hidden"
            >
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SearchProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SearchProvider>
  )
}
