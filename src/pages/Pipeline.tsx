import * as React from "react"
import { PageContainer, PageHeader } from "@/components/layout/PageContainer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Search,
  ArrowRight,
  ArrowLeft,
  Trophy,
  TrendingUp,
  Clock,
  Sparkles,
  Mail,
  DollarSign,
  Layers,
  RefreshCw,
} from "lucide-react"
import { useWorkspace } from "@/context/WorkspaceContext"
import { subscribeToLeads, saveLead, deleteLead } from "@/data/leadsService"
import { auth } from "@/lib/firebase"
import type { LeadItem, LeadFormData, LeadStage } from "@/types/lead"
import { LeadFormDialog } from "@/components/leads/LeadFormDialog"
import { LeadDetailsDialog, WhatsAppIcon } from "@/components/leads/LeadDetailsDialog"
import { toast } from "sonner"

export default function Pipeline() {
  const {
    settings,
    formatCurrency,
    formatCompactCurrency,
    getWhatsAppUrl,
    activePipelineStages,
    pipelineTemplates,
    setPipelineTemplate,
    isSyncing,
  } = useWorkspace()

  const workspaceId = auth.currentUser?.uid || "shared"

  // Live Firestore leads state
  const [leads, setLeads] = React.useState<LeadItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedPriority, setSelectedPriority] = React.useState<string>("all")
  const [dragOverStage, setDragOverStage] = React.useState<string | null>(null)
  const [draggedLeadId, setDraggedLeadId] = React.useState<string | null>(null)

  // Dialog states
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [formDefaultStage, setFormDefaultStage] = React.useState<string>("In Discovery")
  const [editingLead, setEditingLead] = React.useState<LeadItem | null>(null)
  const [viewingLead, setViewingLead] = React.useState<LeadItem | null>(null)

  // Real-time Firestore subscription
  React.useEffect(() => {
    const unsubscribe = subscribeToLeads(workspaceId, (fetchedLeads) => {
      setLeads(fetchedLeads.filter((l) => !l.isArchived))
    })
    return () => unsubscribe()
  }, [workspaceId])

  // Synchronize viewingLead with live leads
  const activeViewingLead = React.useMemo(() => {
    if (!viewingLead) return null
    return leads.find((l) => l.id === viewingLead.id) || viewingLead
  }, [leads, viewingLead])

  // Filter leads based on search & priority
  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      if (selectedPriority !== "all" && lead.priority.toLowerCase() !== selectedPriority.toLowerCase()) {
        return false
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase()
        const match =
          lead.businessName.toLowerCase().includes(q) ||
          lead.contactPerson.toLowerCase().includes(q) ||
          lead.serviceInterest.toLowerCase().includes(q) ||
          lead.location.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [leads, selectedPriority, searchQuery])

  // Executive Metrics Calculations
  const activeDeals = React.useMemo(
    () => leads.filter((l) => l.status !== "Lost" && l.status !== "Won"),
    [leads]
  )

  const activePipelineValue = React.useMemo(
    () => activeDeals.reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
    [activeDeals]
  )

  const wonDeals = React.useMemo(
    () => leads.filter((l) => l.status === "Won"),
    [leads]
  )

  const wonRevenue = React.useMemo(
    () => wonDeals.reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
    [wonDeals]
  )

  const lostCount = React.useMemo(
    () => leads.filter((l) => l.status === "Lost").length,
    [leads]
  )

  const winRatePercent = React.useMemo(() => {
    const totalClosed = wonDeals.length + lostCount
    if (totalClosed === 0) return 0
    return Math.round((wonDeals.length / totalClosed) * 100)
  }, [wonDeals.length, lostCount])

  const avgDealSize = React.useMemo(() => {
    if (activeDeals.length === 0) return 0
    return Math.round(activePipelineValue / activeDeals.length)
  }, [activePipelineValue, activeDeals.length])

  // Stage change handlers
  const handleMoveStage = async (leadId: string, newStage: string) => {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead) return
    try {
      await saveLead(workspaceId, {
        ...lead,
        status: newStage as LeadStage,
        lastContactIST: "Today, just now",
      })
      if (newStage === "Won") {
        toast.success(`🎉 Closed Won: ${lead.businessName}!`, {
          description: `Contract value: ${formatCurrency(lead.estimatedValue)}`,
        })
      } else {
        toast.info(`Moved "${lead.businessName}" to ${newStage}`)
      }
    } catch {
      toast.error("Failed to move deal")
    }
  }

  // Quick move forward to next stage
  const handleAdvanceStage = (lead: LeadItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const currentIndex = activePipelineStages.findIndex((s) => s.id === lead.status)
    if (currentIndex >= 0 && currentIndex < activePipelineStages.length - 1) {
      const nextStage = activePipelineStages[currentIndex + 1].id
      handleMoveStage(lead.id, nextStage)
    }
  }

  // Quick move back to previous stage
  const handleRegressStage = (lead: LeadItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const currentIndex = activePipelineStages.findIndex((s) => s.id === lead.status)
    if (currentIndex > 0) {
      const prevStage = activePipelineStages[currentIndex - 1].id
      handleMoveStage(lead.id, prevStage)
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId)
    setDraggedLeadId(leadId)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId)
    }
  }

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    setDragOverStage(null)
    const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId
    if (leadId) {
      handleMoveStage(leadId, targetStage)
    }
    setDraggedLeadId(null)
  }

  // Add / Edit lead
  const handleSaveLead = async (formData: LeadFormData) => {
    try {
      if (editingLead) {
        await saveLead(workspaceId, {
          ...editingLead,
          ...formData,
        })
        toast.success(`Updated deal: ${formData.businessName}`)
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
        await saveLead(workspaceId, newLead)
        toast.success(`Created deal: ${formData.businessName}`)
      }
    } catch {
      toast.error("Failed to save deal")
    }
  }

  const handleDeleteLead = async (id: string, name: string) => {
    try {
      await deleteLead(workspaceId, id)
      toast.info(`Deleted deal: ${name}`)
      if (viewingLead?.id === id) setViewingLead(null)
    } catch {
      toast.error("Failed to delete deal")
    }
  }

  const handleToggleArchive = async (id: string, archive: boolean) => {
    const lead = leads.find((l) => l.id === id)
    if (!lead) return
    try {
      await saveLead(workspaceId, {
        ...lead,
        isArchived: archive,
        archivedAt: archive ? new Date().toISOString() : undefined,
      })
      toast.info(archive ? "Deal archived" : "Deal restored to pipeline")
      if (viewingLead?.id === id) setViewingLead(null)
    } catch {
      toast.error("Failed to update deal")
    }
  }

  // Quick Open "+ Add Deal" under a specific column
  const openAddDealForStage = (stageId: string) => {
    setEditingLead(null)
    setFormDefaultStage(stageId)
    setIsFormOpen(true)
  }

  return (
    <PageContainer maxWidth="full">
      {/* Top Header */}
      <PageHeader
        title="Pipeline"
        description="Visual deal flow and sales stages for client engagements."
        badge={
          <div className="flex items-center gap-1.5">
            <Badge variant="indigo" size="sm">
              {formatCompactCurrency(activePipelineValue)} Active Flow
            </Badge>
            {isSyncing && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                Syncing
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => openAddDealForStage(activePipelineStages[0]?.id || "In Discovery")}
              className="gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Deal</span>
            </Button>
          </div>
        }
      />

      {/* 1. Executive Performance Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Active Pipeline</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {formatCompactCurrency(activePipelineValue)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Across {activeDeals.length} qualified prospects
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Closed Won</span>
            <Trophy className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCompactCurrency(wonRevenue)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {wonDeals.length} won contracts
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Win Conversion</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {winRatePercent}%
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {wonDeals.length} won / {wonDeals.length + lostCount} closed
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Average Deal Size</span>
            <DollarSign className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {formatCompactCurrency(avgDealSize)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Average active engagement
          </p>
        </div>
      </div>

      {/* 2. Pipeline Template Presets Bar & Search Controls */}
      <div className="rounded-xl border border-border/80 bg-card p-3 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Template Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 mr-1">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>Pipeline Template:</span>
            </span>
            {Object.values(pipelineTemplates).map((tpl) => {
              const isSelected = (settings.pipelineTemplate || "Agency") === tpl.id
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setPipelineTemplate(tpl.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-secondary/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {tpl.name}
                </button>
              )
            })}
          </div>

          {/* Quick Search & Priority Filters */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-secondary/30"
              />
            </div>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-8 rounded-md border border-border bg-secondary/30 px-2.5 text-xs font-medium text-foreground cursor-pointer focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Interactive Kanban Board Columns */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${
          activePipelineStages.length === 4
            ? "lg:grid-cols-4"
            : activePipelineStages.length === 5
            ? "lg:grid-cols-5"
            : activePipelineStages.length >= 6
            ? "lg:grid-cols-6"
            : "lg:grid-cols-3"
        } gap-4 items-start`}
      >
        {activePipelineStages.map((column, colIdx) => {
          const columnDeals = filteredLeads.filter((l) => l.status === column.id)
          const columnTotalValue = columnDeals.reduce((acc, l) => acc + (l.estimatedValue || 0), 0)
          const isDragTarget = dragOverStage === column.id

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col rounded-xl border transition-all duration-200 bg-muted/20 ${
                isDragTarget
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.01]"
                  : "border-border/70"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-border/60 p-3 bg-muted/40 rounded-t-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      column.color === "emerald"
                        ? "bg-emerald-500"
                        : column.color === "amber"
                        ? "bg-amber-500"
                        : column.color === "sky"
                        ? "bg-sky-500"
                        : column.color === "indigo"
                        ? "bg-indigo-500"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="text-xs font-semibold text-foreground truncate">
                    {column.label}
                  </span>
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold text-muted-foreground border border-border/80">
                    {columnDeals.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {formatCompactCurrency(columnTotalValue)}
                  </span>
                  <button
                    type="button"
                    title={`Add deal to ${column.label}`}
                    onClick={() => openAddDealForStage(column.id)}
                    className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Column Deals List */}
              <div className="flex flex-col gap-2.5 p-2.5 min-h-[140px] md:min-h-[420px]">
                {columnDeals.map((deal) => {
                  const initials = deal.businessName
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()

                  const whatsAppUrl = getWhatsAppUrl(deal.phone, deal.contactPerson)

                  return (
                    <div
                      key={deal.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={() => setViewingLead(deal)}
                      className="group relative rounded-lg border border-border/80 bg-card p-3 shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing space-y-2.5"
                    >
                      {/* Deal Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-primary font-bold text-[11px] border border-border/50">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {deal.businessName}
                            </h4>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {deal.contactPerson} • {deal.location}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant={
                            deal.priority === "Urgent"
                              ? "destructive"
                              : deal.priority === "High"
                              ? "warning"
                              : deal.priority === "Medium"
                              ? "indigo"
                              : "neutral"
                          }
                          size="sm"
                          className="shrink-0 text-[10px]"
                        >
                          {deal.priority}
                        </Badge>
                      </div>

                      {/* Scope & Service */}
                      <div className="text-[11px] text-muted-foreground font-medium truncate">
                        {deal.serviceInterest}
                      </div>

                      {/* Valuation & Follow-up touchpoint */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                        <span className="font-mono font-bold text-foreground">
                          {formatCurrency(deal.estimatedValue)}
                        </span>

                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground/70" />
                          <span>{deal.nextFollowUpDate || "No touchpoint"}</span>
                        </span>
                      </div>

                      {/* Quick Hover Action Buttons Bar */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between pt-1 text-[11px] border-t border-border/40"
                      >
                        {/* Direct contact shortcuts */}
                        <div className="flex items-center gap-1">
                          {deal.phone && (
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                            >
                              <WhatsAppIcon className="h-3 w-3" />
                            </a>
                          )}
                          {deal.email && (
                            <a
                              href={`mailto:${deal.email}`}
                              title="Send Email"
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Mail className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {/* Stage step advancement arrows */}
                        <div className="flex items-center gap-1">
                          {colIdx > 0 && (
                            <button
                              type="button"
                              title="Move back"
                              onClick={(e) => handleRegressStage(deal, e)}
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </button>
                          )}

                          {colIdx < activePipelineStages.length - 1 && (
                            <button
                              type="button"
                              title="Move forward"
                              onClick={(e) => handleAdvanceStage(deal, e)}
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-secondary/40 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}

                          {deal.status !== "Won" && (
                            <button
                              type="button"
                              title="Mark as Won"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveStage(deal.id, "Won")
                              }}
                              className="flex h-6 px-1.5 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors text-[10px] font-semibold cursor-pointer"
                            >
                              <Trophy className="h-3 w-3 mr-0.5" />
                              <span>Won</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Empty stage placeholder */}
                {columnDeals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 px-2 text-center rounded-lg border border-dashed border-border/60 bg-secondary/10">
                    <span className="text-[11px] text-muted-foreground/70 font-medium">
                      No deals in {column.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 mt-0.5">
                      Drag a card here or add deal
                    </span>
                  </div>
                )}

                {/* Add deal to column */}
                <button
                  type="button"
                  onClick={() => openAddDealForStage(column.id)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/80 py-2 text-xs font-medium text-muted-foreground hover:bg-card hover:border-primary/50 hover:text-foreground transition-all cursor-pointer mt-auto"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add deal to {column.label}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add / Edit Lead Dialog */}
      <LeadFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        leadToEdit={editingLead}
        defaultStage={formDefaultStage}
        onSubmit={handleSaveLead}
      />

      {/* View Lead Details Dialog */}
      <LeadDetailsDialog
        lead={activeViewingLead}
        open={Boolean(viewingLead)}
        onOpenChange={(open) => !open && setViewingLead(null)}
        onEdit={(lead) => {
          setEditingLead(lead)
          setIsFormOpen(true)
        }}
        onStatusChange={(id, st) => handleMoveStage(id, st)}
        onDelete={handleDeleteLead}
        onArchiveToggle={handleToggleArchive}
      />
    </PageContainer>
  )
}
