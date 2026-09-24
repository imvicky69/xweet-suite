import * as React from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Columns3,
  CheckSquare,
  Receipt,
  Settings,
  Search,
  Bell,
  Plus,
  Menu,
  X,
  ChevronDown,
  Command,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"
import { Toaster } from "sonner"

interface AppShellProps {
  children: React.ReactNode
}

interface NavItemConfig {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: string | number
  badgeVariant?: "indigo" | "neutral" | "default"
}

const mainNavItems: NavItemConfig[] = [
  {
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    to: "/leads",
    icon: Users,
    label: "Leads",
    badge: "3 new",
    badgeVariant: "indigo",
  },
  {
    to: "/pipeline",
    icon: Columns3,
    label: "Pipeline",
    badge: 8,
    badgeVariant: "neutral",
  },
  {
    to: "/tasks",
    icon: CheckSquare,
    label: "Tasks",
    badge: 5,
    badgeVariant: "neutral",
  },
]

const secondaryNavItems = [
  {
    to: "#invoices",
    icon: Receipt,
    label: "Invoices",
    tag: "Soon",
  },
  {
    to: "#settings",
    icon: Settings,
    label: "Settings",
  },
]

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const location = useLocation()

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Get current page title for breadcrumb
  const currentNav = mainNavItems.find(
    (item) =>
      item.to === location.pathname ||
      (item.to !== "/" && location.pathname.startsWith(item.to))
  )
  const pageTitle = currentNav ? currentNav.label : "Overview"

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground antialiased">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 ease-in-out md:static md:translate-x-0",
          mobileMenuOpen ? "translate-x-0 shadow-lg" : "-translate-x-full"
        )}
      >
        {/* Workspace Brand / Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/80 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-xs tracking-tight shadow-none">
              XS
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-tight text-foreground leading-tight">
                Xweet Suite
              </span>
              <span className="text-[10px] text-muted-foreground leading-none">
                Freelance HQ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Badge variant="indigo" size="sm" className="hidden sm:inline-flex">
              PRO
            </Badge>
            <Button
              variant="ghost"
              size="icon-xs"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Search Trigger */}
        <div className="p-3">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-border/70 bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:border-border hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Jump to or search...</span>
            </span>
            <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-border bg-muted/60 px-1 text-[10px] font-medium text-muted-foreground">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5">
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Workspace
            </div>
            <nav className="space-y-0.5">
              {mainNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-secondary text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <Badge
                            variant={item.badgeVariant || "neutral"}
                            size="sm"
                            className="font-normal"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-0.5 rounded-r bg-primary" />
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div>
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Tools & Management
            </div>
            <nav className="space-y-0.5">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.to}
                    href={item.to}
                    className="group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span>{item.label}</span>
                    </div>
                    {item.tag && (
                      <span className="text-[10px] text-muted-foreground/80 border border-border/80 px-1 py-0.25 rounded font-mono">
                        {item.tag}
                      </span>
                    )}
                  </a>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: User / Status */}
        <div className="border-t border-border/80 p-3">
          <div className="flex items-center justify-between rounded-md border border-border/60 bg-card p-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-xs font-semibold text-foreground">
                RS
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-medium text-foreground leading-tight">
                  Rajvi S.
                </span>
                <span className="truncate text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Synced
                </span>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main Area: Top Header + Page View */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur-xs md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <Button
              variant="outline"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Breadcrumb Path */}
            <nav className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer hidden sm:inline">
                Workspace
              </span>
              <span className="text-muted-foreground/60 hidden sm:inline">/</span>
              <span className="font-medium text-foreground">{pageTitle}</span>
            </nav>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Live IST indicator */}
            <div className="hidden md:flex items-center gap-2 rounded-md border border-border/70 bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-foreground font-medium">IST (UTC+5:30)</span>
              <span className="text-muted-foreground/60">|</span>
              <span className="font-semibold text-primary">₹ INR</span>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>

            <NavLink to="/leads">
              <Button
                size="sm"
                className="gap-1.5 font-medium text-xs shadow-none cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Lead</span>
              </Button>
            </NavLink>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>

      <Toaster position="bottom-right" />
    </div>
  )
}
