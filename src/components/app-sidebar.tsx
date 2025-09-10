import { Link, useRouter } from '@tanstack/react-router'
import { FolderOpen, Home, Link as LinkIcon, LogOut, Tag } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function AppSidebar() {
  const router = useRouter()

  const handleLogout = () => {
    authClient.signOut()
    router.navigate({ to: '/auth/login' })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LinkIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Link Manager</span>
            <span className="text-xs text-muted-foreground">
              Organize your bookmarks
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center">
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem className="flex justify-center">
                <SidebarMenuButton asChild tooltip="Home">
                  <Link
                    to="/"
                    className="w-full display-flex group-data-[collapsible=icon]:justify-center"
                  >
                    <Home className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Home
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="flex justify-center">
                <SidebarMenuButton asChild tooltip="Links">
                  <Link
                    to="/links"
                    className="w-full display-flex group-data-[collapsible=icon]:justify-center"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Links
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="flex justify-center">
                <SidebarMenuButton asChild tooltip="Categories">
                  <Link
                    to="/categories"
                    className="w-full display-flex group-data-[collapsible=icon]:justify-center"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Categories
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="flex justify-center">
                <SidebarMenuButton asChild tooltip="Tags">
                  <Link
                    to="/tags"
                    className="w-full display-flex group-data-[collapsible=icon]:justify-center"
                  >
                    <Tag className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Tags
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="w-full display-flex group-data-[collapsible=icon]:justify-center"
            >
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                Logout
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
