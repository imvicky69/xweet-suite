import * as React from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Columns3,
  CheckSquare,
  Receipt,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  Command,
  LogOut,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"
import { toast, Toaster } from "sonner"
import { useWorkspace } from "@/context/WorkspaceContext"
import { AppLogo } from "@/components/ui/app-logo"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"

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
    isExternal: true,
  },
  {
    to: "/settings",
    icon: Settings,
    label: "Settings",
    isExternal: false,
  },
]

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false)
  const profileMenuRef = React.useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { settings } = useWorkspace()

  // Close mobile sidebar and profile dropdown on route change
  React.useEffect(() => {
    setMobileMenuOpen(false)
    setProfileMenuOpen(false)
  }, [location.pathname])

  // Click outside and escape key handling for profile menu
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false)
      }
    }
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [profileMenuOpen])

  // Handle Firebase and local logout
  const handleLogout = async () => {
    setProfileMenuOpen(false)
    setMobileMenuOpen(false)
    try {
      await signOut(auth)
      toast.success("Logged out successfully")
    } catch (err) {
      console.warn("Firebase signout error:", err)
      toast.success("Logged out")
    } finally {
      navigate("/login")
    }
  }

  // Live clock ticker right beside currency
  const [liveTime, setLiveTime] = React.useState("")

  React.useEffect(() => {
    const updateTime = () => {
      try {
        const t = new Intl.DateTimeFormat(settings.currency.locale, {
          timeZone: settings.timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date())
        setLiveTime(t)
      } catch {
        setLiveTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
      }
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [settings.timezone, settings.currency.locale])

  // Get current page title for breadcrumb
  const currentNav = [...mainNavItems, ...secondaryNavItems].find(
    (item) =>
      item.to === location.pathname ||
      (item.to !== "/" && !item.to.startsWith("#") && location.pathname.startsWith(item.to))
  )
  const pageTitle = currentNav ? currentNav.label : "Overview"

  const initials = settings.accountOwnerName
    ? settings.accountOwnerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "XS"

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
            <AppLogo variant="dark" size="sm" />
            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-tight text-foreground leading-tight truncate max-w-[130px]">
                {settings.workspaceName}
              </span>
              <span className="text-[10px] text-muted-foreground leading-none truncate max-w-[130px]">
                {settings.tagline}
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
                if (item.isExternal) {
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
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
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
        </div>

        {/* Sidebar Footer: User / Profile Menu */}
        <div className="relative border-t border-border/80 p-3" ref={profileMenuRef}>
          {/* Profile Dropdown Popover */}
          {profileMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 z-50 rounded-xl border border-border/80 bg-card/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              {/* User Info Header */}
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/50 border border-border/40">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-primary/10 text-xs font-bold text-primary">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {settings.accountOwnerName}
                    </span>
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 capitalize">
                      {settings.plan || "Pro"}
                    </span>
                  </div>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {settings.accountEmail || auth.currentUser?.email || "account@xweet.io"}
                  </span>
                  {settings.workspaceName && (
                    <span className="truncate text-[10px] text-muted-foreground/80 mt-1 flex items-center gap-1 font-medium">
                      <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {settings.workspaceName}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Links */}
              <div className="mt-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    navigate("/settings")
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors cursor-pointer text-left"
                >
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Workspace Settings</span>
                </button>
              </div>

              <div className="my-1 border-t border-border/60" />

              {/* Logout Option */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400 transition-colors cursor-pointer text-left"
              >
                <LogOut className="h-3.5 w-3.5 text-red-500" />
                <span>Log out</span>
              </button>
            </div>
          )}

          {/* Profile Trigger Button */}
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            aria-expanded={profileMenuOpen}
            aria-haspopup="true"
            className={cn(
              "w-full flex items-center justify-between rounded-lg border p-2 transition-all cursor-pointer text-left",
              profileMenuOpen
                ? "border-primary/50 bg-secondary/80 ring-1 ring-primary/20 shadow-xs"
                : "border-border/60 bg-card hover:bg-secondary/50"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-xs font-semibold text-foreground">
                {initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-medium text-foreground leading-tight">
                  {settings.accountOwnerName}
                </span>
                <span className="truncate text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {settings.country.code} · Active
                </span>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
                profileMenuOpen && "rotate-180 text-foreground"
              )}
            />
          </button>
        </div>
      </aside>

      {/* Main Area: Top Header + Page View */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur-xs md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger & Logo */}
            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <AppLogo variant="dark" size="xs" />
            </div>

            {/* Breadcrumb Path */}
            <nav className="flex items-center gap-1.5 text-xs">
              <NavLink to="/" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer hidden sm:inline">
                Workspace
              </NavLink>
              <span className="text-muted-foreground/60 hidden sm:inline">/</span>
              <span className="font-medium text-foreground">{pageTitle}</span>
            </nav>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Simple Live Time & Currency Badge */}
            <NavLink
              to="/settings"
              title="Click to configure Workplace Preferences"
              className="flex items-center gap-2 rounded-md border border-border/80 bg-card px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-foreground font-semibold">{liveTime}</span>
              <span className="text-muted-foreground/40">|</span>
              <span className="font-semibold text-primary">{settings.currency.symbol} {settings.currency.code}</span>
            </NavLink>

            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>
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
