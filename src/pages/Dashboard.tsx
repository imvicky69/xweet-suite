import * as React from "react"
import { useNavigate } from "react-router-dom"
import { PageContainer, PageHeader } from "@/components/layout/PageContainer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  TrendingUp,
  Users,
  Briefcase,
  Clock,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Circle,
  Download,
  Trash2,
  Mail,
  ExternalLink,
  Target,
  StickyNote,
  Pin,
  Phone,
} from "lucide-react"
import { toast } from "sonner"
import { useWorkspace } from "@/context/WorkspaceContext"
import { AppLogo } from "@/components/ui/app-logo"
import { initialMockLeads } from "@/data/mockLeads"
import type { LeadItem } from "@/types/lead"
import { hasValidPhone, hasValidEmail } from "@/types/lead"
import { WhatsAppIcon } from "@/components/leads/LeadDetailsDialog"
import { getFollowUpStatus } from "@/lib/formatters"

interface Milestone {
  id: string
  title: string
  client: string
  due: string
  urgent: boolean
  done: boolean
}

interface QuickNoteItem {
  id: string
  text: string
  category: string
  timestamp: string
}

interface ClientInquiry {
  client: string
  project: string
  budget: string
  status: string
  badgeVariant: "indigo" | "neutral" | "success" | "warning" | "destructive"
  date: string
  email: string
  location: string
}

const initialMilestones: Milestone[] = [
  {
    id: "m-1",
    title: "Deliver finalized brand guidelines presentation",
    client: "Aura Design Co.",
    due: "Today, 5:00 PM IST",
    urgent: true,
    done: false,
  },
  {
    id: "m-2",
    title: "Review Hyperion auth module PR on GitHub",
    client: "Hyperion Cloud SaaS",
    due: "Tomorrow, 12:00 PM IST",
    urgent: false,
    done: false,
  },
  {
    id: "m-3",
    title: "Send retainer invoice #1042 (₹2,20,000)",
    client: "Northwind Health Tech",
    due: "Friday, Sep 26 IST",
    urgent: false,
    done: false,
  },
  {
    id: "m-4",
    title: "Initial kickoff alignment call on Google Meet",
    client: "Kite Fintech Ventures",
    due: "Completed",
    urgent: false,
    done: true,
  },
]

const recentInquiries: ClientInquiry[] = [
  {
    client: "Aura Design Co.",
    project: "Design System Architecture",
    budget: "₹6,50,000",
    status: "Proposal Sent",
    badgeVariant: "indigo",
    date: "Today, 04:00 PM IST",
    email: "elena@auradesign.io",
    location: "Mumbai, MH",
  },
  {
    client: "Hyperion Cloud SaaS",
    project: "Full-Stack MVP Development",
    budget: "₹12,50,000",
    status: "Discovery Call",
    badgeVariant: "neutral",
    date: "Today, 05:30 PM IST",
    email: "marcus@hyperioncloud.dev",
    location: "Bengaluru, KA",
  },
  {
    client: "Kite Fintech Ventures",
    project: "Brand Identity & Webflow",
    budget: "₹4,80,000",
    status: "Lead In",
    badgeVariant: "neutral",
    date: "Tomorrow, 11:00 AM IST",
    email: "sofia@kitefin.vc",
    location: "Gurugram, HR",
  },
  {
    client: "Northwind Health Tech",
    project: "SaaS UI/UX Revamp",
    budget: "₹8,20,000",
    status: "Contract Draft",
    badgeVariant: "success",
    date: "27 Sep, 03:00 PM IST",
    email: "david@northwindhealth.in",
    location: "Hyderabad, TS",
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { settings, formatCurrency, formatCompactCurrency, getWhatsAppUrl } = useWorkspace()

  // Leads for Follow-up Reminders & Pinned Notes
  const [dashboardLeads, setDashboardLeads] = React.useState<LeadItem[]>(() => {
    try {
      const saved = localStorage.getItem("xweet_leads_mock")
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.warn("Could not read leads for dashboard", e)
    }
    return initialMockLeads
  })

  // Filter pinned reminders or follow-ups (excluding archived leads)
  const pinnedFollowUps = React.useMemo(() => {
    return dashboardLeads.filter(
      (l) =>
        !l.isArchived &&
        l.status !== "Won" &&
        l.status !== "Lost" &&
        (l.showOnDashboard || (l.dashboardNote && l.dashboardNote.trim().length > 0))
    )
  }, [dashboardLeads])

  const dismissReminder = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = dashboardLeads.map((l) =>
      l.id === leadId ? { ...l, showOnDashboard: false, dashboardNote: "" } : l
    )
    setDashboardLeads(updated)
    try {
      localStorage.setItem("xweet_leads_mock", JSON.stringify(updated))
    } catch {}
    toast.info("Reminder dismissed from dashboard")
  }

  // Milestones State with localStorage persistence
  const [milestones, setMilestones] = React.useState<Milestone[]>(() => {
    const saved = localStorage.getItem("xweet_dashboard_milestones")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return initialMilestones
      }
    }
    return initialMilestones
  })

  React.useEffect(() => {
    localStorage.setItem("xweet_dashboard_milestones", JSON.stringify(milestones))
  }, [milestones])

  // Quick Notes State with localStorage persistence
  const [notes, setNotes] = React.useState<QuickNoteItem[]>(() => {
    const saved = localStorage.getItem("xweet_dashboard_notes")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return [
          {
            id: "note-1",
            text: "Discuss multi-region AWS latency optimization with Marcus on today's 5:30 PM IST call.",
            category: "Client Call",
            timestamp: "Today, 10:15 AM IST",
          },
        ]
      }
    }
    return [
      {
        id: "note-1",
        text: "Discuss multi-region AWS latency optimization with Marcus on today's 5:30 PM IST call.",
        category: "Client Call",
        timestamp: "Today, 10:15 AM IST",
      },
    ]
  })

  React.useEffect(() => {
    localStorage.setItem("xweet_dashboard_notes", JSON.stringify(notes))
  }, [notes])

  // Dialog states
  const [quickNoteOpen, setQuickNoteOpen] = React.useState(false)
  const [newNoteText, setNewNoteText] = React.useState("")
  const [newNoteCategory, setNewNoteCategory] = React.useState("General")

  const [inquiryModalLead, setInquiryModalLead] = React.useState<ClientInquiry | null>(null)

  const [newMilestoneTitle, setNewMilestoneTitle] = React.useState("")
  const [newMilestoneClient, setNewMilestoneClient] = React.useState("")
  const [showAddMilestone, setShowAddMilestone] = React.useState(false)

  // Live Clock
  const [istTime, setIstTime] = React.useState("")
  const [istDate, setIstDate] = React.useState("")
  const [greeting, setGreeting] = React.useState("Welcome")

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      try {
        const timeStr = new Intl.DateTimeFormat(settings.currency.locale, {
          timeZone: settings.timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(now)

        const dateStr = new Intl.DateTimeFormat(settings.currency.locale, {
          timeZone: settings.timezone,
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(now)

        setIstTime(timeStr)
        setIstDate(dateStr)

        const hours = parseInt(
          new Intl.DateTimeFormat(settings.currency.locale, {
            timeZone: settings.timezone,
            hour: "numeric",
            hour12: false,
          }).format(now),
          10
        )

        if (hours < 12) setGreeting("Good morning")
        else if (hours < 17) setGreeting("Good afternoon")
        else setGreeting("Good evening")
      } catch {
        setIstTime(now.toLocaleTimeString())
        setIstDate(now.toLocaleDateString())
      }
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [settings.timezone, settings.currency.locale])

  // Milestone actions
  const toggleMilestone = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const updated = !m.done
          if (updated) {
            toast.success(`Completed: ${m.title}`)
          }
          return { ...m, done: updated }
        }
        return m
      })
    )
  }

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMilestoneTitle.trim()) return
    const newM: Milestone = {
      id: `m-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      client: newMilestoneClient.trim() || "Internal",
      due: "Pending IST",
      urgent: false,
      done: false,
    }
    setMilestones((prev) => [newM, ...prev])
    setNewMilestoneTitle("")
    setNewMilestoneClient("")
    setShowAddMilestone(false)
    toast.success("New milestone added")
  }

  const handleDeleteMilestone = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setMilestones((prev) => prev.filter((m) => m.id !== id))
    toast.info("Milestone removed")
  }

  // Quick Note actions
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return
    const newNote: QuickNoteItem = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      category: newNoteCategory,
      timestamp: `Today, ${istTime} IST`,
    }
    setNotes((prev) => [newNote, ...prev])
    setNewNoteText("")
    toast.success("Quick note saved to workspace")
  }

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    toast.info("Note deleted")
  }

  // Download Executive Summary
  const handleDownloadSummary = () => {
    const summaryText = `=====================================================
XWEET SUITE - FREELANCE HQ EXECUTIVE SUMMARY
Generated: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
Currency: Indian Rupee (INR ₹)
=====================================================

1. FINANCIAL PERFORMANCE
• Total Month-to-Date Revenue: ₹14,50,000 (+14.2% vs previous 30 days)
• Active Negotiation Pipeline: ₹38,20,000 (across 4 qualified opportunities)
• Active Monthly Retainer Clients: 6 accounts (₹6,50,000/mo steady run-rate)
• Q3 Revenue Target: ₹20,00,000 (₹14.5L achieved • 72.5% pacing)

2. HIGH-PRIORITY ENGAGEMENTS & LEADS
• Hyperion Cloud SaaS (Bengaluru): ₹12,50,000 [Full-Stack MVP Development]
• Vektor AI Diagnostics (Pune): ₹15,00,000 [AI Integration & Dashboard Prototyping]
• Northwind Health Tech (Hyderabad): ₹8,20,000 [Hospital Patient EHR Revamp]
• Aura Design Co. (Mumbai): ₹6,50,000 [Multi-platform Design System]
• Kite Fintech Ventures (Gurugram): ₹4,80,000 [Brand Refresh & Webflow Engine]

3. PENDING MILESTONES & TASKS
${milestones
  .map(
    (m) =>
      `• [${m.done ? "DONE" : "PENDING"}] ${m.title} (${m.client}) - Due: ${m.due}`
  )
  .join("\n")}

4. RECENT QUICK STRATEGY NOTES
${notes.map((n) => `• [${n.category}] ${n.text} (${n.timestamp})`).join("\n")}

=====================================================
Generated by Xweet Suite - Indian Freelance Command HQ
`

    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Xweet-Suite-Executive-Summary-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Executive summary report downloaded successfully")
  }

  const pendingMilestonesCount = milestones.filter((m) => !m.done).length

  return (
    <PageContainer>
      {/* Top Header */}
      <PageHeader
        title="Dashboard"
        description="High-level overview of active client accounts, revenue, and pipeline."
        badge={
          <Badge variant="indigo" size="sm">
            Q3 Active
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSummary}
              className="gap-1.5 cursor-pointer text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Summary</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setQuickNoteOpen(true)}
              className="gap-1.5 cursor-pointer text-xs font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Quick Note</span>
            </Button>
          </div>
        }
      />

      {/* Greeting & Live Time Command Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-3.5 sm:px-4 sm:py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <AppLogo variant="dark" size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                {greeting}, {settings.accountOwnerName.split(" ")[0]}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live {settings.timezoneLabel.split(" ")[0]} Sync
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {istDate} • <span className="font-mono font-medium text-foreground">{istTime}</span> ({settings.country.code})
            </p>
          </div>
        </div>

        {/* Quick Route Shortcuts */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/leads")}
            className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer hover:border-primary/50 hover:text-primary transition-colors"
          >
            <span>Leads CRM</span>
            <Badge variant="indigo" size="sm">
              8 Deals
            </Badge>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/pipeline")}
            className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer hover:border-primary/50 hover:text-primary transition-colors"
          >
            <span>Pipeline Board</span>
            <Badge variant="neutral" size="sm">
              ₹65L
            </Badge>
          </Button>
        </div>
      </div>

      {/* Revenue Goal & Monthly Pacing Progress Bar */}
      <Card className="p-4 border-primary/20 bg-gradient-to-r from-card via-card to-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs">
              <Target className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-foreground">
                Q3 Revenue Target: {formatCurrency(2000000)} ({settings.currency.code})
              </span>
              <span className="text-[11px] text-muted-foreground ml-2">
                72.5% Achieved ({formatCurrency(1450000)} Collected)
              </span>
            </div>
          </div>
          <span className="text-[11px] font-medium text-primary">
            {formatCompactCurrency(550000)} to goal • 5 days remaining
          </span>
        </div>

        {/* Progress bar with electric blue accent and glow */}
        <div className="relative h-2.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_12px_var(--accent-glow)]"
            style={{ width: "72.5%" }}
          />
        </div>
      </Card>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Revenue
            </CardTitle>
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-secondary text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatCurrency(1450000)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                +14.2%
              </span>
              <span>vs previous 30 days ({settings.currency.code})</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Retainers */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Retainers
            </CardTitle>
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-secondary text-primary">
              <Users className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              6 Clients
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="indigo" size="sm">
                {formatCompactCurrency(650000)}/mo steady
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Value */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pipeline Value
            </CardTitle>
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-secondary text-primary">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatCurrency(3820000)}
            </div>
            <div className="text-xs text-muted-foreground">
              4 active deals in negotiation
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pending Deliverables
            </CardTitle>
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-secondary text-primary">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {pendingMilestonesCount} Remaining
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-amber-600 dark:text-amber-400">
                1 due today
              </span>
              <span>by 5:00 PM IST</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pinned Follow-Up Reminders & Notes */}
      {pinnedFollowUps.length > 0 && (
        <Card className="border-primary/30 bg-gradient-to-r from-card via-card to-primary/5 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs shadow-2xs">
                  <Pin className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <span>Follow-Up Reminders & Pinned Notes</span>
                    <Badge variant="indigo" size="sm">
                      {pinnedFollowUps.length} Active
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Client touchpoints and action items scheduled in your CRM
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="xs"
                className="gap-1 text-xs text-primary hover:text-primary/80 cursor-pointer font-medium"
                onClick={() => navigate("/leads")}
              >
                <span>View all in CRM</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pinnedFollowUps.map((lead) => {
                const followUp = getFollowUpStatus(lead.nextFollowUpDate, lead.nextFollowUpTime)
                const waUrl = getWhatsAppUrl(lead.phone, lead.contactPerson)

                return (
                  <div
                    key={lead.id}
                    onClick={() => navigate("/leads")}
                    className="flex flex-col justify-between rounded-lg border border-border/80 bg-card p-3 shadow-2xs hover:border-primary/50 transition-all cursor-pointer space-y-2.5 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                            {lead.businessName}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {lead.contactPerson} • {lead.location}
                          </p>
                        </div>
                        <Badge
                          variant={followUp.isToday ? "warning" : "neutral"}
                          size="sm"
                          className="shrink-0 text-[10px]"
                        >
                          {followUp.label}
                        </Badge>
                      </div>

                      {/* Reminder Note */}
                      <div className="rounded-md bg-secondary/40 border border-border/50 p-2 text-xs text-foreground">
                        <p className="line-clamp-2 text-[11px] text-muted-foreground italic">
                          "{lead.dashboardNote || lead.notes || "Scheduled follow-up touchpoint"}"
                        </p>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div
                      className="flex items-center justify-between pt-1 border-t border-border/50 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        {hasValidPhone(lead.phone) && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {hasValidPhone(lead.phone) && (
                          <a
                            href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                            className="inline-flex h-6 w-6 items-center justify-center rounded bg-secondary text-foreground hover:bg-muted transition-colors"
                            title={`Call ${lead.phone}`}
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                        )}
                        {hasValidEmail(lead.email) && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="inline-flex h-6 w-6 items-center justify-center rounded bg-secondary text-foreground hover:bg-muted transition-colors"
                            title={`Email ${lead.email}`}
                          >
                            <Mail className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => dismissReminder(lead.id, e)}
                        className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer px-1.5 py-0.5 rounded hover:bg-secondary transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Section: 2 Columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column: Recent Client Inquiries */}
        <Card className="lg:col-span-7">
          <CardHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Client Inquiries</CardTitle>
                <CardDescription>
                  Prospective engagements from this week (Click to preview)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="xs"
                className="gap-1 text-xs text-primary hover:text-primary/80 cursor-pointer font-medium"
                onClick={() => navigate("/leads")}
              >
                <span>View all leads</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {recentInquiries.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setInquiryModalLead(item)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {item.client}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.project} • <span className="font-mono font-medium text-foreground">{item.budget}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge variant={item.badgeVariant} size="sm">
                      {item.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground/80 hidden sm:inline">
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Key Milestones / Interactive Tasks */}
        <Card className="lg:col-span-5 flex flex-col">
          <CardHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Milestones & Deliverables</CardTitle>
                <CardDescription>Click checkbox to toggle completed state</CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant={pendingMilestonesCount > 0 ? "indigo" : "success"} size="sm">
                  {pendingMilestonesCount} Pending
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowAddMilestone(!showAddMilestone)}
                  title="Add milestone"
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {/* Inline Add Milestone Form */}
            {showAddMilestone && (
              <form onSubmit={handleAddMilestone} className="p-3 border-b border-border/60 bg-muted/20 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Milestone description..."
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className="h-7 text-xs bg-card"
                    autoFocus
                  />
                  <Input
                    placeholder="Client name"
                    value={newMilestoneClient}
                    onChange={(e) => setNewMilestoneClient(e.target.value)}
                    className="h-7 text-xs bg-card w-28"
                  />
                </div>
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowAddMilestone(false)}
                    className="h-6 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="xs" className="h-6 text-xs">
                    Save
                  </Button>
                </div>
              </form>
            )}

            <div className="divide-y divide-border/60">
              {milestones.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleMilestone(task.id)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  {task.done ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0 transition-transform active:scale-90" />
                  ) : (
                    <Circle className="h-4 w-4 mt-0.5 text-muted-foreground/70 shrink-0 hover:text-primary transition-transform active:scale-90" />
                  )}

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p
                      className={`text-xs font-medium transition-all ${
                        task.done
                          ? "line-through text-muted-foreground"
                          : "text-foreground group-hover:text-primary"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {task.client} • {task.due}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {task.urgent && !task.done && (
                      <Badge variant="warning" size="sm">
                        Urgent
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteMilestone(task.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                      title="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Notes Dialog */}
      <Dialog open={quickNoteOpen} onOpenChange={setQuickNoteOpen}>
        <DialogContent maxWidth="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <StickyNote className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>Quick Workspace Note</DialogTitle>
                <DialogDescription>
                  Jot down fast client insights, ideas, or meeting notes.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <form onSubmit={handleSaveNote} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Category:</span>
                {["Client Call", "Tech Architecture", "Strategy", "Reminder"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewNoteCategory(cat)}
                    className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors border cursor-pointer ${
                      newNoteCategory === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="Type your strategy note here..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={3}
                className="text-xs"
              />

              <div className="flex justify-end">
                <Button type="submit" size="sm" className="gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Save Note</span>
                </Button>
              </div>
            </form>

            {/* Saved Notes List */}
            <div className="space-y-2 border-t border-border/60 pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Saved Notes ({notes.length})
              </span>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start justify-between gap-2 rounded-md border border-border/80 bg-muted/20 p-2.5 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="indigo" size="sm">
                          {note.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {note.timestamp}
                        </span>
                      </div>
                      <p className="text-foreground text-xs leading-relaxed">{note.text}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickNoteOpen(false)}
              className="cursor-pointer text-xs"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Inquiry Preview Modal */}
      <Dialog
        open={Boolean(inquiryModalLead)}
        onOpenChange={(open) => !open && setInquiryModalLead(null)}
      >
        <DialogContent maxWidth="max-w-md">
          {inquiryModalLead && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{inquiryModalLead.client}</DialogTitle>
                  <Badge variant={inquiryModalLead.badgeVariant} size="sm">
                    {inquiryModalLead.status}
                  </Badge>
                </div>
                <DialogDescription>
                  {inquiryModalLead.location} • Inquired {inquiryModalLead.date}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                    Estimated Deal Budget (INR)
                  </span>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {inquiryModalLead.budget}
                  </div>
                  <span className="text-muted-foreground text-[11px]">
                    Scope: {inquiryModalLead.project}
                  </span>
                </div>

                <div className="rounded-lg border border-border/80 bg-card p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>{inquiryModalLead.email}</span>
                  </div>
                  <a
                    href={`mailto:${inquiryModalLead.email}`}
                    className="text-primary hover:underline font-medium"
                  >
                    Send Mail
                  </a>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInquiryModalLead(null)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setInquiryModalLead(null)
                    navigate("/leads")
                  }}
                  className="gap-1 text-xs cursor-pointer"
                >
                  <span>Open in Leads CRM</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
