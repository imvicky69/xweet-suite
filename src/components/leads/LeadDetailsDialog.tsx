import * as React from "react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LeadItem, LeadStage } from "@/types/lead"
import { hasValidPhone, hasValidEmail } from "@/types/lead"
import { getFollowUpStatus } from "@/lib/formatters"
import { useWorkspace } from "@/context/WorkspaceContext"
import { toast } from "sonner"
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Briefcase,
  Edit2,
  ExternalLink,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  Building2,
  Sparkles,
  ArrowRight,
  User,
  Archive,
  ArchiveRestore,
} from "lucide-react"

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

interface LeadDetailsDialogProps {
  lead: LeadItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (lead: LeadItem) => void
  onStatusChange: (leadId: string, newStatus: LeadStage) => void
  onDelete?: (leadId: string, businessName: string) => void
  onArchiveToggle?: (leadId: string, shouldArchive: boolean) => void
}

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

const PIPELINE_STAGES: LeadStage[] = [
  "New",
  "Contacted",
  "In Discovery",
  "Proposal Sent",
  "Negotiation",
  "Won",
]

export function LeadDetailsDialog({
  lead,
  open,
  onOpenChange,
  onEdit,
  onStatusChange,
  onDelete,
  onArchiveToggle,
}: LeadDetailsDialogProps) {
  const { formatCurrency, getWhatsAppUrl } = useWorkspace()
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  if (!lead) return null

  const followUpInfo = getFollowUpStatus(lead.nextFollowUpDate, lead.nextFollowUpTime)
  const whatsAppUrl = getWhatsAppUrl(lead.phone, lead.contactPerson)

  // Clean follow-up label to remove redundant IST mentions
  const cleanFollowUpLabel = followUpInfo.label.replace(/\s*\(?IST\)?/g, "").trim()
  const cleanLastContact = lead.lastContactIST ? lead.lastContactIST.replace(/\s*\(?IST\)?/g, "").trim() : ""

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const cleanWebsite = lead.website ? lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : ""

  // Calculate initials for company avatar
  const initials = lead.businessName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const activeStageIndex = PIPELINE_STAGES.indexOf(lead.status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-2xl" className="p-0 overflow-hidden sm:rounded-xl">
        {/* Top Header Card */}
        <div className="border-b border-border/80 bg-card p-4 sm:p-5">
          <div className="flex items-start gap-3.5 pr-8">
            {/* Monogram Icon */}
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm sm:text-base shadow-xs">
              {initials || <Building2 className="h-5 w-5" />}
            </div>

            {/* Title & Metadata */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate">
                  {lead.businessName}
                </h2>
                <Badge variant={stageBadgeVariant[lead.status]} size="sm">
                  {lead.status}
                </Badge>
                <Badge
                  variant={
                    lead.priority === "Urgent"
                      ? "destructive"
                      : lead.priority === "High"
                      ? "warning"
                      : "neutral"
                  }
                  size="sm"
                >
                  {lead.priority} Priority
                </Badge>
                {lead.isArchived && (
                  <Badge variant="warning" size="sm" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 font-semibold">
                    <Archive className="h-3 w-3" />
                    <span>Archived</span>
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <User className="h-3 w-3 text-muted-foreground" />
                  {lead.contactPerson}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {lead.location}
                </span>
                {lead.industry && (
                  <>
                    <span>•</span>
                    <span className="text-muted-foreground">{lead.industry}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="space-y-3.5 p-4 sm:p-5 overflow-y-auto max-h-[calc(85vh-160px)] text-xs">
          {/* 1. Deal Value & Scope Hero Card */}
          <div className="rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-secondary/30 p-3.5 sm:p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>Estimated Deal Value</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono mt-0.5">
                  {formatCurrency(lead.estimatedValue)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Source: <span className="font-medium text-foreground">{lead.source}</span>
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Scope & Deliverable
                </div>
                <div className="font-semibold text-foreground flex items-center gap-1.5 sm:justify-end mt-1 text-sm">
                  <Briefcase className="h-4 w-4 text-primary shrink-0" />
                  <span>{lead.serviceInterest}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Industry: <span className="font-medium text-foreground">{lead.industry}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Direct Channels: 2-Column Responsive Grid (No Truncation) */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Direct Contact Channels
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* WhatsApp Direct Chat (Only if valid phone) */}
              {hasValidPhone(lead.phone) && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white shadow-2xs">
                      <WhatsAppIcon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium leading-none">
                        WhatsApp Chat
                      </span>
                      <span className="truncate font-semibold text-xs text-emerald-950 dark:text-emerald-100 mt-0.5">
                        Message {lead.contactPerson.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-600 transition-transform group-hover:translate-x-0.5 shrink-0 ml-1.5" />
                </a>
              )}

              {/* Direct Phone with Copy Trigger (Only if valid phone) */}
              {hasValidPhone(lead.phone) && (
                <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-2.5 hover:border-primary/40 transition-colors shadow-2xs">
                  <a
                    href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-2.5 min-w-0 flex-1 hover:text-primary transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-muted-foreground leading-none">Call Mobile</span>
                      <span className="font-mono font-medium text-xs text-foreground mt-0.5">
                        {lead.phone}
                      </span>
                    </div>
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(lead.phone, "Phone number")}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors cursor-pointer shrink-0 ml-1"
                    title="Copy Phone"
                  >
                    {copiedField === "Phone number" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}

              {/* Email Client with Copy Trigger */}
              {hasValidEmail(lead.email) && (
                <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-2.5 hover:border-primary/40 transition-colors shadow-2xs">
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-2.5 min-w-0 flex-1 hover:text-primary transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-muted-foreground leading-none">Email Address</span>
                      <span className="truncate font-medium text-xs text-foreground mt-0.5">
                        {lead.email}
                      </span>
                    </div>
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(lead.email, "Email")}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors cursor-pointer shrink-0 ml-1"
                    title="Copy Email"
                  >
                    {copiedField === "Email" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}

              {/* Graceful fallback if no phone was provided */}
              {!hasValidPhone(lead.phone) && (
                <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-secondary/30 p-2.5 text-muted-foreground">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground/60">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-muted-foreground/60 leading-none">Phone & WhatsApp</span>
                    <span className="text-xs italic text-muted-foreground/70 mt-0.5">Email communication only</span>
                  </div>
                </div>
              )}

              {/* Website / Portfolio Link */}
              {lead.website ? (
                <a
                  href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-lg border border-border/80 bg-card p-2.5 hover:border-primary/40 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-muted-foreground leading-none">Website</span>
                      <span className="truncate font-medium text-xs text-foreground mt-0.5">
                        {cleanWebsite}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-1.5" />
                </a>
              ) : (
                <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-secondary/30 p-2.5 text-muted-foreground/70">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground/60">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-muted-foreground/60 leading-none">Website</span>
                    <span className="text-xs italic text-muted-foreground/60 mt-0.5">Not provided</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Follow-up & Touchpoint Timeline Banner */}
          <div className="rounded-lg border border-border/80 bg-card p-3 sm:p-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      {cleanFollowUpLabel || "Schedule Follow-up"}
                    </span>
                    {followUpInfo.isToday && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Next interaction milestone
                  </span>
                </div>
              </div>

              {cleanLastContact && (
                <div className="text-left sm:text-right border-t sm:border-t-0 pt-1.5 sm:pt-0 border-border/50 text-[11px] text-muted-foreground flex items-center sm:block gap-1">
                  <span>Last Contact:</span>
                  <span className="font-medium text-foreground">{cleanLastContact}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Notes & Context Block */}
          {lead.notes && (
            <div className="rounded-lg border-l-2 border-primary/70 bg-secondary/30 p-3 sm:p-3.5 shadow-xs space-y-1">
              <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span>Notes & Client Brief</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-xs whitespace-pre-wrap pl-5">
                {lead.notes}
              </p>
            </div>
          )}

          {/* 5. Interactive Pipeline Stepper Progression */}
          <div className="pt-2 border-t border-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pipeline Progression
              </span>
              <span className="text-[11px] text-muted-foreground">
                Click a stage to update status
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-secondary/40 p-1.5 rounded-lg border border-border/60">
              {PIPELINE_STAGES.map((st, idx) => {
                const isActive = lead.status === st
                const isPassed = activeStageIndex > idx && lead.status !== "Lost"

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onStatusChange(lead.id, st)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-medium transition-all cursor-pointer text-center relative ${
                      isActive
                        ? "bg-primary text-white shadow-xs font-semibold"
                        : isPassed
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border/40"
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider opacity-75 font-mono mb-0.5">
                      Step {idx + 1}
                    </span>
                    <span className="truncate w-full text-[11px] px-0.5">
                      {st}
                    </span>
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Quick Lost Status Toggle */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => onStatusChange(lead.id, lead.status === "Lost" ? "New" : "Lost")}
                className={`text-[11px] font-medium transition-colors cursor-pointer px-2 py-0.5 rounded border ${
                  lead.status === "Lost"
                    ? "bg-destructive text-destructive-foreground border-destructive"
                    : "text-muted-foreground border-transparent hover:text-destructive hover:bg-destructive/10"
                }`}
              >
                {lead.status === "Lost" ? "Marked as Lost Deal (Click to Reactivate)" : "Mark deal as Lost"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border/80 bg-card p-3 sm:p-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onArchiveToggle && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onArchiveToggle(lead.id, !lead.isArchived)
                  onOpenChange(false)
                }}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {lead.isArchived ? (
                  <>
                    <ArchiveRestore className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    <span>Restore to Pipeline</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5 mr-1.5" />
                    <span>Archive Lead</span>
                  </>
                )}
              </Button>
            )}

            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm(`Delete lead "${lead.businessName}"? This cannot be undone.`)) {
                    onOpenChange(false)
                    onDelete(lead.id, lead.businessName)
                  }
                }}
                className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                <span>Delete</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer text-xs flex-1 sm:flex-none"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onEdit(lead)
              }}
              className="cursor-pointer gap-1.5 text-xs flex-1 sm:flex-none font-medium shadow-xs"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Lead</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
