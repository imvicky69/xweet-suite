import * as React from "react"
import { PageContainer, PageHeader } from "@/components/layout/PageContainer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Search,
  SlidersHorizontal,
  Mail,
  Phone,
  Eye,
  Edit2,
  Calendar,
  X,
  ArrowUpDown,
  Building2,
  ExternalLink,
  Archive,
  ArchiveRestore,
} from "lucide-react"
import { toast } from "sonner"
import type { LeadItem, LeadFormData, LeadStage, LeadPriority } from "@/types/lead"
import { hasValidPhone, hasValidEmail } from "@/types/lead"
import { initialMockLeads } from "@/data/mockLeads"
import { LeadWidgets } from "@/components/leads/LeadWidgets"
import { LeadFormDialog } from "@/components/leads/LeadFormDialog"
import { LeadDetailsDialog, WhatsAppIcon } from "@/components/leads/LeadDetailsDialog"
import { getFollowUpStatus } from "@/lib/formatters"
import { useWorkspace } from "@/context/WorkspaceContext"

const stageBadgeVariant: Record<
  LeadStage,
  "default" | "indigo" | "neutral" | "success" | "warning" | "destructive"
> = {
  New: "neutral",
  Contacted: "neutral",
  "In Discovery": "indigo",
  "Proposal Sent": "indigo",
  Negotiation: "warning",
  Won: "success",
  Lost: "destructive",
}

const priorityBadgeVariant: Record<
  LeadPriority,
  "default" | "indigo" | "neutral" | "success" | "warning" | "destructive"
> = {
  Urgent: "destructive",
  High: "warning",
  Medium: "indigo",
  Low: "neutral",
}

export default function Leads() {
  const { settings, formatCurrency, getWhatsAppUrl } = useWorkspace()
  const [leads, setLeads] = React.useState<LeadItem[]>(() => {
    const saved = localStorage.getItem("xweet_leads_mock")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return initialMockLeads
      }
    }
    return initialMockLeads
  })

  // Sync with localStorage
  React.useEffect(() => {
    localStorage.setItem("xweet_leads_mock", JSON.stringify(leads))
  }, [leads])

  // View mode: active pipeline vs archived lists
  const [viewMode, setViewMode] = React.useState<"active" | "archived">("active")

  // Active vs Archived collections
  const activeLeads = React.useMemo(() => leads.filter((l) => !l.isArchived), [leads])
  const archivedLeads = React.useMemo(() => leads.filter((l) => Boolean(l.isArchived)), [leads])

  // Archive / Restore handler
  const handleToggleArchive = (leadId: string, shouldArchive: boolean) => {
    const targetLead = leads.find((l) => l.id === leadId)
    const now = new Date().toISOString().slice(0, 10)
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              isArchived: shouldArchive,
              archivedAt: shouldArchive ? now : undefined,
              showOnDashboard: shouldArchive ? false : l.showOnDashboard,
            }
          : l
      )
    )
    if (shouldArchive) {
      toast.success(`Archived "${targetLead?.businessName || "lead"}"`, {
        description: "Moved to Archive Lists. Hidden from main active pipeline.",
      })
    } else {
      toast.success(`Restored "${targetLead?.businessName || "lead"}"`, {
        description: "Moved back to active pipeline.",
      })
    }
    if (viewingLead && viewingLead.id === leadId) {
      setViewingLead((prev) =>
        prev
          ? {
              ...prev,
              isArchived: shouldArchive,
              archivedAt: shouldArchive ? now : undefined,
            }
          : null
      )
    }
  }

  // Filter & Search states
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedStage, setSelectedStage] = React.useState<string>("all")
  const [selectedPriority, setSelectedPriority] = React.useState<string>("all")
  const [selectedSource, setSelectedSource] = React.useState<string>("all")
  const [sortBy, setSortBy] = React.useState<string>("value-desc")
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false)

  // Dialog states
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingLead, setEditingLead] = React.useState<LeadItem | null>(null)
  const [viewingLead, setViewingLead] = React.useState<LeadItem | null>(null)

  // Add / Edit lead submission
  const handleSaveLead = (formData: LeadFormData) => {
    if (editingLead) {
      const updated: LeadItem = {
        ...editingLead,
        ...formData,
      }
      setLeads((prev) => prev.map((l) => (l.id === editingLead.id ? updated : l)))
      toast.success(`Updated lead for ${formData.businessName}`)
      setEditingLead(null)
    } else {
      const now = new Date()
      const newLead: LeadItem = {
        ...formData,
        id: `lead-${Date.now()}`,
        createdAt: now.toISOString().slice(0, 10),
        lastContactIST: "Just now",
        isArchived: false,
      }
      setLeads((prev) => [newLead, ...prev])
      toast.success(`Created lead: ${formData.businessName} (₹${formData.estimatedValue.toLocaleString("en-IN")})`)
    }
  }

  // Delete lead (safely called from Details dialog)
  const handleDeleteLead = (id: string, name: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    toast.info(`Deleted lead: ${name}`)
    if (viewingLead?.id === id) setViewingLead(null)
  }

  // Stage change quick action
  const handleStatusChange = (leadId: string, newStatus: LeadStage) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status: newStatus,
              lastContactIST: "Today, just now",
            }
          : l
      )
    )
    toast.success(`Stage updated to "${newStatus}"`)
    if (viewingLead && viewingLead.id === leadId) {
      setViewingLead((prev) => (prev ? { ...prev, status: newStatus } : null))
    }
  }

  // Current lead pool based on active view mode
  const currentPool = viewMode === "active" ? activeLeads : archivedLeads

  // Filter logic
  const filteredLeads = React.useMemo(() => {
    return currentPool
      .filter((lead) => {
        if (selectedStage !== "all" && lead.status.toLowerCase() !== selectedStage.toLowerCase()) {
          return false
        }
        if (selectedPriority !== "all" && lead.priority.toLowerCase() !== selectedPriority.toLowerCase()) {
          return false
        }
        if (selectedSource !== "all" && lead.source.toLowerCase() !== selectedSource.toLowerCase()) {
          return false
        }
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase()
          const match =
            lead.businessName.toLowerCase().includes(q) ||
            lead.contactPerson.toLowerCase().includes(q) ||
            lead.email.toLowerCase().includes(q) ||
            lead.location.toLowerCase().includes(q) ||
            lead.industry.toLowerCase().includes(q) ||
            lead.serviceInterest.toLowerCase().includes(q) ||
            lead.phone.includes(q) ||
            (lead.notes && lead.notes.toLowerCase().includes(q))
          if (!match) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === "value-desc") return b.estimatedValue - a.estimatedValue
        if (sortBy === "value-asc") return a.estimatedValue - b.estimatedValue
        if (sortBy === "name-asc") return a.businessName.localeCompare(b.businessName)
        if (sortBy === "followup-asc") return a.nextFollowUpDate.localeCompare(b.nextFollowUpDate)
        if (sortBy === "priority-urgent") {
          const priorityScore: Record<LeadPriority, number> = {
            Urgent: 4,
            High: 3,
            Medium: 2,
            Low: 1,
          }
          return priorityScore[b.priority] - priorityScore[a.priority]
        }
        return 0
      })
  }, [currentPool, selectedStage, selectedPriority, selectedSource, searchQuery, sortBy])

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("")
    setSelectedStage("all")
    setSelectedPriority("all")
    setSelectedSource("all")
    setSortBy("value-desc")
  }

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedStage !== "all" ||
    selectedPriority !== "all" ||
    selectedSource !== "all"

  // Stage tab counters based on current active view
  const stageCounts = React.useMemo(() => {
    const pool = viewMode === "active" ? activeLeads : archivedLeads
    const counts: Record<string, number> = {
      all: pool.length,
      new: 0,
      contacted: 0,
      "in discovery": 0,
      "proposal sent": 0,
      negotiation: 0,
      won: 0,
      lost: 0,
    }
    pool.forEach((l) => {
      const s = l.status.toLowerCase()
      if (counts[s] !== undefined) counts[s]++
    })
    return counts
  }, [viewMode, activeLeads, archivedLeads])

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title={viewMode === "active" ? "Leads & Outreach" : "Archived Leads"}
        description={
          viewMode === "active"
            ? "Track prospect pipelines, deal valuations, and scheduled follow-ups."
            : "Safely archived prospects and deferred deals, kept separate from your active pipeline."
        }
        badge={
          <div className="flex items-center gap-1.5">
            <Badge variant="indigo" size="sm">
              {activeLeads.length} Active
            </Badge>
            {archivedLeads.length > 0 && (
              <Badge variant="outline" size="sm" className="text-muted-foreground border-border">
                {archivedLeads.length} Archived
              </Badge>
            )}
          </div>
        }
        actions={
          viewMode === "active" ? (
            <Button
              size="sm"
              onClick={() => {
                setEditingLead(null)
                setIsFormOpen(true)
              }}
              className="gap-1.5 cursor-pointer font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Lead</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setViewMode("active")
                setSelectedStage("all")
              }}
              className="gap-1.5 cursor-pointer text-xs"
            >
              <ArchiveRestore className="h-3.5 w-3.5 text-primary" />
              <span>Back to Active Pipeline</span>
            </Button>
          )
        }
      />

      {/* View Switcher: Active Pipeline vs Archived Lists */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setViewMode("active")
              setSelectedStage("all")
            }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "active"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <span>Active Pipeline</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                viewMode === "active" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {activeLeads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode("archived")
              setSelectedStage("all")
            }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "archived"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Archived Lists</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                viewMode === "archived" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {archivedLeads.length}
            </span>
          </button>
        </div>

        {viewMode === "archived" && archivedLeads.length > 0 && (
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Archived leads are hidden from daily active views
          </span>
        )}
      </div>

      {/* Visual Widgets Deck (Active) or Archive Overview Banner */}
      {viewMode === "active" ? (
        <LeadWidgets leads={activeLeads} />
      ) : (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Archive className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Archived Prospects Vault ({archivedLeads.length})</h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Archived prospects are preserved here and excluded from active deal totals, pipeline charts, and dashboard reminders.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setViewMode("active")
              setSelectedStage("all")
            }}
            className="text-xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Return to Active Pipeline
          </Button>
        </div>
      )}

      {/* Filter and Search Bar Section */}
      <div className="space-y-2.5">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by business, contact, city, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8 bg-card border-border/80 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Action and Sort buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 rounded-md border border-border/80 bg-card px-2 py-1 text-xs shrink-0">
              <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              >
                <option value="value-desc">Value (₹ High to Low)</option>
                <option value="value-asc">Value (₹ Low to High)</option>
                <option value="followup-asc">Follow-up (Earliest)</option>
                <option value="priority-urgent">Priority (Urgent First)</option>
                <option value="name-asc">Business Name (A-Z)</option>
              </select>
            </div>

            {/* Filter Toggle */}
            <Button
              variant={showAdvancedFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground shrink-0"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Filters</span>
              {(selectedPriority !== "all" || selectedSource !== "all") && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "All Leads", count: stageCounts.all },
            { id: "new", label: "New", count: stageCounts.new },
            { id: "in discovery", label: "In Discovery", count: stageCounts["in discovery"] },
            { id: "proposal sent", label: "Proposal Sent", count: stageCounts["proposal sent"] },
            { id: "negotiation", label: "Negotiation", count: stageCounts.negotiation },
            { id: "won", label: "Won", count: stageCounts.won },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStage(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer border shrink-0 ${
                selectedStage === tab.id
                  ? "bg-secondary text-foreground border-border font-semibold shadow-2xs"
                  : "bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <span>{tab.label}</span>
              <span className="rounded bg-muted/60 px-1 py-0.25 text-[10px] text-muted-foreground font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 rounded-lg border border-border/70 bg-card/60 p-3 text-xs animate-in fade-in-0 duration-150">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Filter by Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="h-8 w-full rounded border border-border bg-card px-2 text-xs"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Filter by Lead Source
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="h-8 w-full rounded border border-border bg-card px-2 text-xs"
              >
                <option value="all">All Sources</option>
                <option value="twitter/x">Twitter / X</option>
                <option value="linkedin">LinkedIn</option>
                <option value="referral">Referral</option>
                <option value="inbound website">Inbound Website</option>
                <option value="cold outreach">Cold Outreach</option>
                <option value="event / meetup">Event / Meetup</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="h-8 w-full text-xs text-muted-foreground"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Leads Container: Cards on Mobile (< md), Table on Desktop (>= md) */}
      {filteredLeads.length === 0 ? (
        <Card className="overflow-hidden border border-border/80 shadow-2xs">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                viewMode === "archived"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {viewMode === "archived" ? <Archive className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {viewMode === "archived" ? "No archived leads" : "No leads found"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {viewMode === "archived"
                  ? hasActiveFilters
                    ? "No archived leads match your filter criteria."
                    : "Your archive list is currently empty. Use the 'Archive' button on any active lead to safely store deferred prospects here without cluttering your pipeline."
                  : hasActiveFilters
                  ? "Try adjusting your search criteria or resetting filters to see leads."
                  : "Your pipeline is currently empty. Click 'Add Lead' to record prospective clients."}
              </p>
            </div>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs cursor-pointer">
                Reset Filters
              </Button>
            ) : viewMode === "archived" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewMode("active")
                  setSelectedStage("all")
                }}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <ArchiveRestore className="h-3.5 w-3.5 text-primary" />
                <span>Go to Active Pipeline</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setEditingLead(null)
                  setIsFormOpen(true)
                }}
                className="gap-1.5 text-xs cursor-pointer font-medium shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create First Lead</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* MOBILE VIEW (< md): Responsive Touch Cards */}
          <div className="block md:hidden space-y-3">
            {filteredLeads.map((lead) => {
              const followUp = getFollowUpStatus(lead.nextFollowUpDate, lead.nextFollowUpTime)
              const waUrl = getWhatsAppUrl(lead.phone, lead.contactPerson)

              return (
                <div
                  key={lead.id}
                  onClick={() => setViewingLead(lead)}
                  className="rounded-lg border border-border bg-card p-3.5 shadow-2xs hover:border-primary/50 transition-all cursor-pointer space-y-3"
                >
                  {/* Card Header: Business, Website & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {lead.businessName}
                        </span>
                        {lead.website && (
                          <a
                            href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lead.contactPerson} • {lead.location}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={stageBadgeVariant[lead.status]} size="sm">
                        {lead.status}
                      </Badge>
                      <Badge variant={priorityBadgeVariant[lead.priority]} size="sm">
                        {lead.priority}
                      </Badge>
                    </div>
                  </div>

                  {/* Deal Value & Service scope */}
                  <div className="flex items-center justify-between rounded-md bg-secondary/40 p-2.5 text-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Estimated Value ({settings.currency.code})
                      </span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        {formatCurrency(lead.estimatedValue)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Scope
                      </span>
                      <span className="font-medium text-foreground truncate max-w-[150px] block">
                        {lead.serviceInterest}
                      </span>
                    </div>
                  </div>

                  {/* Scheduled Follow-up pill */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span
                        className={`text-[11px] font-medium ${
                          followUp.isToday
                            ? "text-amber-600 dark:text-amber-400 font-semibold"
                            : followUp.isPast
                            ? "text-destructive"
                            : "text-foreground"
                        }`}
                      >
                        {followUp.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground/80">
                      Via {lead.source}
                    </span>
                  </div>

                  {/* Action Toolbar on Mobile (WhatsApp, Call, Email, View, Edit) */}
                  <div
                    className="flex items-center gap-1.5 pt-2 border-t border-border/60"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Primary Direct action: WhatsApp if phone exists, else Email button */}
                    {hasValidPhone(lead.phone) ? (
                      <>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 py-1.5 px-2 text-xs font-semibold border border-emerald-600/30 transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
                          title={`Call ${lead.phone}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </>
                    ) : hasValidEmail(lead.email) ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary py-1.5 px-2 text-xs font-semibold border border-primary/30 transition-colors"
                        title={`Email ${lead.email}`}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Send Email</span>
                      </a>
                    ) : null}

                    {/* Secondary Email icon button if phone was already primary */}
                    {hasValidPhone(lead.phone) && hasValidEmail(lead.email) && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
                        title={`Email ${lead.email}`}
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    )}

                    {/* View Details */}
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                      title="View Details"
                      onClick={() => setViewingLead(lead)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>

                    {/* Edit Lead */}
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                      title="Edit Lead"
                      onClick={() => {
                        setEditingLead(lead)
                        setIsFormOpen(true)
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    {/* Archive / Restore Button */}
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className={`h-8 w-8 shrink-0 cursor-pointer ${
                        viewMode === "active"
                          ? "text-muted-foreground hover:text-amber-600 hover:border-amber-500/40"
                          : "text-primary hover:border-primary bg-primary/5"
                      }`}
                      title={viewMode === "active" ? "Archive Lead" : "Restore to Active Pipeline"}
                      onClick={() => handleToggleArchive(lead.id, viewMode === "active")}
                    >
                      {viewMode === "active" ? (
                        <Archive className="h-3.5 w-3.5" />
                      ) : (
                        <ArchiveRestore className="h-3.5 w-3.5 text-primary" />
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* DESKTOP VIEW (>= md): Full Structured Table with Professional Zebra Striping */}
          <Card className="hidden md:block overflow-hidden border border-border/80 shadow-2xs rounded-xl">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-secondary/60 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider select-none">
                    <th className="py-3 px-4">Prospect & Decision Maker</th>
                    <th className="py-3 px-3 hidden lg:table-cell">Deliverable Scope</th>
                    <th className="py-3 px-3 font-mono">Deal Value ({settings.currency.code})</th>
                    <th className="py-3 px-3">Stage</th>
                    <th className="py-3 px-3 hidden sm:table-cell">Priority</th>
                    <th className="py-3 px-3 hidden lg:table-cell">Next Follow-Up</th>
                    <th className="py-3 px-4 text-right">Quick Outreach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredLeads.map((lead, idx) => {
                    const followUp = getFollowUpStatus(lead.nextFollowUpDate, lead.nextFollowUpTime)
                    const waUrl = getWhatsAppUrl(lead.phone, lead.contactPerson)
                    const isEven = idx % 2 === 0
                    const cleanFollowUp = followUp.label.replace(/\s*\(?IST\)?/g, "")

                    return (
                      <tr
                        key={lead.id}
                        className={`transition-colors duration-150 group cursor-pointer border-b border-border/40 ${
                          isEven
                            ? "bg-card"
                            : "bg-muted/35"
                        } hover:bg-primary/[0.04]`}
                        onClick={() => setViewingLead(lead)}
                      >
                        {/* Business & Contact */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {/* Monogram Chip */}
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-2xs">
                              {lead.businessName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                  {lead.businessName}
                                </span>
                                {lead.website && (
                                  <a
                                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-muted-foreground/60 hover:text-primary transition-colors"
                                    title={`Visit ${lead.website}`}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                <span className="text-foreground/90 font-medium truncate">{lead.contactPerson}</span>
                                <span>•</span>
                                <span className="truncate">{lead.location}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Service & Source */}
                        <td className="py-3 px-3 hidden lg:table-cell">
                          <div className="flex flex-col max-w-[200px]">
                            <span className="truncate font-medium text-foreground">
                              {lead.serviceInterest}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
                              {lead.industry} • via {lead.source}
                            </span>
                          </div>
                        </td>

                        {/* Value in Workspace Currency */}
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                            {formatCurrency(lead.estimatedValue)}
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-mono uppercase">
                            {settings.currency.code}
                          </span>
                        </td>

                        {/* Stage Badge */}
                        <td className="py-3 px-3">
                          <Badge variant={stageBadgeVariant[lead.status]} size="sm" className="font-medium shadow-2xs">
                            {lead.status}
                          </Badge>
                        </td>

                        {/* Priority */}
                        <td className="py-3 px-3 hidden sm:table-cell">
                          <Badge variant={priorityBadgeVariant[lead.priority]} size="sm" className="font-medium shadow-2xs">
                            {lead.priority}
                          </Badge>
                        </td>

                        {/* Next Follow-up */}
                        <td className="py-3 px-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            {followUp.isToday && (
                              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            )}
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span
                              className={`font-medium ${
                                followUp.isToday
                                  ? "text-amber-600 dark:text-amber-400 font-semibold"
                                  : followUp.isPast
                                  ? "text-destructive"
                                  : "text-foreground"
                              }`}
                            >
                              {cleanFollowUp}
                            </span>
                          </div>
                        </td>

                        {/* Actions (WhatsApp, Call, Mail, View, Edit) */}
                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1">
                            {/* Direct WhatsApp button (only if valid phone) */}
                            {hasValidPhone(lead.phone) && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-all shadow-2xs"
                                title="Chat on WhatsApp"
                              >
                                <WhatsAppIcon className="h-3.5 w-3.5" />
                              </a>
                            )}

                            {/* Quick Phone Call (only if valid phone) */}
                            {hasValidPhone(lead.phone) && (
                              <a
                                href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all shadow-2xs"
                                title={`Call ${lead.phone}`}
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                            )}

                            {/* Quick Email (only if valid email) */}
                            {hasValidEmail(lead.email) && (
                              <a
                                href={`mailto:${lead.email}`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all shadow-2xs"
                                title={`Email ${lead.email}`}
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </a>
                            )}

                            {/* View details */}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
                              title="View Details"
                              onClick={() => setViewingLead(lead)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Edit */}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Edit Lead"
                              onClick={() => {
                                setEditingLead(lead)
                                setIsFormOpen(true)
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            {/* Archive / Restore Quick Action */}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className={`cursor-pointer ${
                                viewMode === "active"
                                  ? "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
                                  : "text-primary hover:bg-primary/10"
                              }`}
                              title={viewMode === "active" ? "Archive Lead (Move to Archive Lists)" : "Restore to Active Pipeline"}
                              onClick={() => handleToggleArchive(lead.id, viewMode === "active")}
                            >
                              {viewMode === "active" ? (
                                <Archive className="h-3.5 w-3.5" />
                              ) : (
                                <ArchiveRestore className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Table Footer Status Strip */}
              <div className="border-t border-border/70 bg-secondary/20 px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Showing <strong className="text-foreground font-semibold">{filteredLeads.length}</strong> of {currentPool.length} {viewMode === "active" ? "active prospects" : "archived prospects"}
                </span>
                <span className="font-mono">
                  {viewMode === "active" ? "Filtered Pipeline: " : "Archived Deals Value: "}
                  <strong className="text-foreground font-semibold">
                    {formatCurrency(filteredLeads.reduce((sum, l) => sum + (l.status !== "Lost" ? l.estimatedValue : 0), 0))}
                  </strong>
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add / Edit Lead Dialog */}
      <LeadFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        leadToEdit={editingLead}
        onSubmit={handleSaveLead}
      />

      {/* View Lead Details Dialog (With safe delete & archive toggle inside) */}
      <LeadDetailsDialog
        lead={viewingLead}
        open={Boolean(viewingLead)}
        onOpenChange={(open) => !open && setViewingLead(null)}
        onEdit={(lead) => {
          setEditingLead(lead)
          setIsFormOpen(true)
        }}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteLead}
        onArchiveToggle={handleToggleArchive}
      />
    </PageContainer>
  )
}
