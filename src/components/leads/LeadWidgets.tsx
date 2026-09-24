import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { LeadItem } from "@/types/lead"
import { formatINR, formatCompactINR } from "@/lib/formatters"
import {
  TrendingUp,
  Clock,
  Sparkles,
  AlertCircle,
  Briefcase,
} from "lucide-react"

interface LeadWidgetsProps {
  leads: LeadItem[]
}

export function LeadWidgets({ leads }: LeadWidgetsProps) {
  // Live IST Time clock state
  const [istTimeStr, setIstTimeStr] = React.useState("")
  const [istDateStr, setIstDateStr] = React.useState("")

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeFormatted = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now)

      const dateFormatted = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(now)

      setIstTimeStr(timeFormatted)
      setIstDateStr(dateFormatted)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

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

  // Check follow-ups for today (IST)
  const todayIST = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())

  const todayFollowUps = leads.filter(
    (l) => l.nextFollowUpDate === todayIST && l.status !== "Won" && l.status !== "Lost"
  )

  const wonLeadsValue = leads
    .filter((l) => l.status === "Won")
    .reduce((sum, l) => sum + l.estimatedValue, 0)

  return (
    <div className="space-y-3.5">
      {/* Top Banner: IST Digital Clock & Workspace Pulse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/80 bg-gradient-to-r from-card via-card to-secondary/30 p-3 sm:px-4 sm:py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                Indian Standard Time (IST)
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span>{istDateStr}</span>
              <span>•</span>
              <span className="font-mono font-medium text-foreground">
                {istTimeStr}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">(UTC+05:30)</span>
            </div>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="flex items-center gap-2 text-xs">
          <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
              Won Value (INR)
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
              {formatCompactINR(wonLeadsValue)}
            </span>
          </div>
          <div className="rounded-md border border-border bg-card px-2.5 py-1.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
              Active Pipeline
            </span>
            <span className="font-semibold text-primary font-mono text-xs">
              {formatCompactINR(totalPipelineValue)}
            </span>
          </div>
        </div>
      </div>

      {/* 4-Card Executive KPI Grid (2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {/* Card 1: Total Pipeline Value in INR */}
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
              {formatINR(totalPipelineValue)}
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
              <span>{activeLeadsCount} active</span>
              <Badge variant="indigo" size="sm" className="hidden sm:inline-flex">
                INR (₹)
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

        {/* Card 4: Follow-Ups Scheduled Today (IST) */}
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
    </div>
  )
}
