import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { LeadItem } from "@/types/lead"
import { useWorkspace } from "@/context/WorkspaceContext"
import {
  TrendingUp,
  AlertCircle,
  Briefcase,
  Sparkles,
} from "lucide-react"

interface LeadWidgetsProps {
  leads: LeadItem[]
}

export function LeadWidgets({ leads }: LeadWidgetsProps) {
  const { settings, formatCurrency } = useWorkspace()

  // Aggregate metrics
  const totalPipelineValue = leads
    .filter((l) => l.status !== "Lost")
    .reduce((sum, l) => sum + l.estimatedValue, 0)

  const activeLeadsCount = leads.filter(
    (l) => l.status !== "Lost" && l.status !== "Won"
  ).length

  const highPriorityCount = leads.filter(
    (l) =>
      (l.priority === "Urgent" || l.priority === "High") &&
      l.status !== "Lost" &&
      l.status !== "Won"
  ).length

  // Check follow-ups for today using active workspace timezone
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: settings.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())

  const todayFollowUps = leads.filter(
    (l) => l.nextFollowUpDate === todayStr && l.status !== "Won" && l.status !== "Lost"
  )

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {/* Card 1: Total Pipeline Value in Workspace Currency */}
      <Card className="hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-2.5 sm:pt-3.5 px-3 sm:px-4">
          <CardTitle className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
            Pipeline Value
          </CardTitle>
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md border border-border bg-secondary text-primary shrink-0">
            <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-2.5 sm:pb-3.5 pt-0.5 space-y-1">
          <div className="text-base sm:text-xl font-bold tracking-tight text-foreground font-mono">
            {formatCurrency(totalPipelineValue)}
          </div>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
            <span>{activeLeadsCount} active</span>
            <Badge variant="indigo" size="sm" className="hidden sm:inline-flex">
              {settings.currency.symbol} {settings.currency.code}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Active Leads & Conversion */}
      <Card className="hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-2.5 sm:pt-3.5 px-3 sm:px-4">
          <CardTitle className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
            Active In Discussion
          </CardTitle>
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md border border-border bg-secondary text-primary shrink-0">
            <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-2.5 sm:pb-3.5 pt-0.5 space-y-1">
          <div className="text-base sm:text-xl font-bold tracking-tight text-foreground">
            {activeLeadsCount}{" "}
            <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">
              of {leads.length}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {leads.length > 0
                ? `${Math.round((activeLeadsCount / leads.length) * 100)}%`
                : "0%"}
            </span>
            <span className="truncate">in pipeline</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Urgent / High Priority */}
      <Card className="hover:border-primary/40 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-2.5 sm:pt-3.5 px-3 sm:px-4">
          <CardTitle className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
            High Priority
          </CardTitle>
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md border border-border bg-secondary text-primary shrink-0">
            <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-2.5 sm:pb-3.5 pt-0.5 space-y-1">
          <div className="text-base sm:text-xl font-bold tracking-tight text-foreground">
            {highPriorityCount}{" "}
            <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">
              Deals
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
            Urgent client focus
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Follow-Ups Scheduled Today */}
      <Card
        className={`transition-colors ${
          todayFollowUps.length > 0
            ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10"
            : "hover:border-primary/40"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-2.5 sm:pt-3.5 px-3 sm:px-4">
          <CardTitle className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
            Today's Follow-ups
          </CardTitle>
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-2.5 sm:pb-3.5 pt-0.5 space-y-1">
          <div className="text-base sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
            <span>{todayFollowUps.length} Scheduled</span>
            {todayFollowUps.length > 0 && (
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {todayFollowUps.length > 0
              ? `${todayFollowUps.length} follow-ups due`
              : "No pending touches"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
