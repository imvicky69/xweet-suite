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
} from "lucide-react"
import { toast } from "sonner"
import type { LeadItem, LeadFormData, LeadStage, LeadPriority } from "@/types/lead"
import { initialMockLeads } from "@/data/mockLeads"
import { LeadWidgets } from "@/components/leads/LeadWidgets"
import { LeadFormDialog } from "@/components/leads/LeadFormDialog"
import { LeadDetailsDialog, WhatsAppIcon } from "@/components/leads/LeadDetailsDialog"
import { formatINR, getFollowUpStatus, getWhatsAppUrl } from "@/lib/formatters"

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

  // Filter logic
  const filteredLeads = React.useMemo(() => {
    return leads
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
  }, [leads, selectedStage, selectedPriority, selectedSource, searchQuery, sortBy])

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

  // Stage tab counters
  const stageCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: leads.length,
      new: 0,
      contacted: 0,
      "in discovery": 0,
      "proposal sent": 0,
      negotiation: 0,
      won: 0,
    }
    leads.forEach((l) => {
      const s = l.status.toLowerCase()
      if (counts[s] !== undefined) counts[s]++
    })
    return counts
  }, [leads])

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Leads & Outreach"
        description="Comprehensive Indian lead pipeline, valuation in INR, and IST follow-up management."
        badge={
          <Badge variant="indigo" size="sm">
            {leads.length} Total Prospects
          </Badge>
        }
        actions={
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
        }
      />

      {/* Visual Widgets Deck */}
      <LeadWidgets leads={leads} />

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
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">No leads found</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                {hasActiveFilters
                  ? "Try adjusting your search criteria or resetting filters to see leads."
                  : "Your pipeline is currently empty. Click 'Add Lead' to record prospective clients."}
              </p>
            </div>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                Reset Filters
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setEditingLead(null)
                  setIsFormOpen(true)
                }}
                className="gap-1.5 text-xs"
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
                        Estimated Value
                      </span>
                      <span className="font-mono font-bold text-sm text-foreground">
                        {formatINR(lead.estimatedValue)}
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
                    {/* Direct WhatsApp button */}
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

                    {/* Direct Phone Call */}
                    <a
                      href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
                      title={`Call ${lead.phone}`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>

                    {/* Direct Email */}
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
                      title={`Email ${lead.email}`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </a>

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
                  </div>
                </div>
              )
            })}
          </div>

          {/* DESKTOP VIEW (>= md): Full Structured Table */}
          <Card className="hidden md:block overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-medium">
                    <th className="py-2.5 px-4 font-medium">Company & Contact</th>
                    <th className="py-2.5 px-3 font-medium hidden lg:table-cell">Service & Source</th>
                    <th className="py-2.5 px-3 font-medium">Value (INR)</th>
                    <th className="py-2.5 px-3 font-medium">Stage</th>
                    <th className="py-2.5 px-3 font-medium hidden sm:table-cell">Priority</th>
                    <th className="py-2.5 px-3 font-medium hidden lg:table-cell">
                      Next Follow-up (IST)
                    </th>
                    <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLeads.map((lead) => {
                    const followUp = getFollowUpStatus(lead.nextFollowUpDate, lead.nextFollowUpTime)
                    const waUrl = getWhatsAppUrl(lead.phone, lead.contactPerson)

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => setViewingLead(lead)}
                      >
                        {/* Business & Contact */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                              {lead.businessName}
                              {lead.website && (
                                <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {lead.contactPerson} • {lead.location}
                            </span>
                          </div>
                        </td>

                        {/* Service & Source */}
                        <td className="py-3 px-3 hidden lg:table-cell">
                          <div className="flex flex-col max-w-[200px]">
                            <span className="truncate font-medium text-foreground">
                              {lead.serviceInterest}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {lead.source}
                            </span>
                          </div>
                        </td>

                        {/* Value in INR */}
                        <td className="py-3 px-3">
                          <div className="font-mono font-semibold text-foreground">
                            {formatINR(lead.estimatedValue)}
                          </div>
                          <span className="text-[10px] text-muted-foreground">INR</span>
                        </td>

                        {/* Stage Badge */}
                        <td className="py-3 px-3">
                          <Badge variant={stageBadgeVariant[lead.status]} size="sm">
                            {lead.status}
                          </Badge>
                        </td>

                        {/* Priority */}
                        <td className="py-3 px-3 hidden sm:table-cell">
                          <Badge variant={priorityBadgeVariant[lead.priority]} size="sm">
                            {lead.priority}
                          </Badge>
                        </td>

                        {/* Next Follow-up (IST) */}
                        <td className="py-3 px-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span
                              className={`font-medium ${
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
                        </td>

                        {/* Actions (WhatsApp, Call, Mail, View, Edit - NO exposed delete button) */}
                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1">
                            {/* Direct WhatsApp button */}
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                            </a>

                            {/* Quick Phone Call */}
                            <a
                              href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground transition-colors"
                              title={`Call ${lead.phone}`}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>

                            {/* Quick Email */}
                            <a
                              href={`mailto:${lead.email}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground transition-colors"
                              title={`Email ${lead.email}`}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </a>

                            {/* View details */}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-foreground"
                              title="View Details"
                              onClick={() => setViewingLead(lead)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Edit */}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-foreground"
                              title="Edit Lead"
                              onClick={() => {
                                setEditingLead(lead)
                                setIsFormOpen(true)
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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

      {/* View Lead Details Dialog (With safe delete button inside) */}
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
      />
    </PageContainer>
  )
}
