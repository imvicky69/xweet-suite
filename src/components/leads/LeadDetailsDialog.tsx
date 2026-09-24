import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LeadItem, LeadStage } from "@/types/lead"
import { formatINR, getFollowUpStatus, getWhatsAppUrl } from "@/lib/formatters"
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  Edit2,
  ExternalLink,
  MessageSquare,
  Trash2,
} from "lucide-react"

export function WhatsAppIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
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

export function LeadDetailsDialog({
  lead,
  open,
  onOpenChange,
  onEdit,
  onStatusChange,
  onDelete,
}: LeadDetailsDialogProps) {
  if (!lead) return null

  const followUpInfo = getFollowUpStatus(lead.nextFollowUpDate, lead.nextFollowUpTime)
  const whatsAppUrl = getWhatsAppUrl(lead.phone, lead.contactPerson)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-2xl">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-6">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base sm:text-lg">{lead.businessName}</DialogTitle>
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
              </div>
              <DialogDescription className="flex flex-wrap items-center gap-1.5 text-xs">
                <span>Contact: <strong className="text-foreground font-medium">{lead.contactPerson}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {lead.location}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-3 overflow-y-auto max-h-[calc(85vh-160px)] pr-1 text-xs">
          {/* Top Deal Card (INR potential & Service) */}
          <div className="rounded-lg border border-border bg-secondary/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Estimated Deal Value
              </span>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                {formatINR(lead.estimatedValue)}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Source: {lead.source}
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Service Focus
              </span>
              <div className="font-medium text-foreground flex items-center gap-1.5 sm:justify-end mt-0.5">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
                <span>{lead.serviceInterest}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Industry: {lead.industry}
              </span>
            </div>
          </div>

          {/* Quick Action Contact Channels (Including WhatsApp Button) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {/* WhatsApp Direct Chat */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition-colors"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
                <WhatsAppIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">WhatsApp</span>
                <span className="truncate font-semibold text-xs">Chat Direct</span>
              </div>
            </a>

            {/* Direct Phone */}
            <a
              href={`tel:${lead.phone.replace(/\s+/g, "")}`}
              className="flex items-center gap-2 rounded-md border border-border/80 bg-card p-2.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                <Phone className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground">Call Mobile</span>
                <span className="truncate font-medium text-foreground">{lead.phone}</span>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-2 rounded-md border border-border/80 bg-card p-2.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground">Email Client</span>
                <span className="truncate font-medium text-foreground">{lead.email}</span>
              </div>
            </a>

            {/* Website */}
            {lead.website ? (
              <a
                href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md border border-border/80 bg-card p-2.5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <Globe className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-muted-foreground">Website</span>
                  <span className="truncate font-medium text-foreground flex items-center gap-1">
                    {lead.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </span>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 p-2.5 opacity-60">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">No site</span>
              </div>
            )}
          </div>

          {/* Follow-up & Indian Standard Time Schedule */}
          <div className="rounded-lg border border-border/80 bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Next Follow-Up (IST Schedule)</span>
              </span>
              {followUpInfo.isToday && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Scheduled Today
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{followUpInfo.label}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Last Contact: {lead.lastContactIST}
              </span>
            </div>
          </div>

          {/* Notes Section */}
          <div className="rounded-lg border border-border/80 bg-card p-3 space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Notes & Context</span>
            </div>
            <p className="text-foreground leading-relaxed text-xs whitespace-pre-wrap">
              {lead.notes || "No notes added yet."}
            </p>
          </div>

          {/* Stage Progression Quick Action */}
          <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium">Update Pipeline Stage:</span>
            <div className="flex flex-wrap gap-1.5">
              {(["New", "Contacted", "In Discovery", "Proposal Sent", "Negotiation", "Won", "Lost"] as LeadStage[]).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => onStatusChange(lead.id, st)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer border ${
                      lead.status === st
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer with safely placed Delete button and primary actions */}
        <DialogFooter className="pt-3 border-t border-border/70 flex flex-col-reverse sm:flex-row items-center justify-between gap-2">
          {onDelete ? (
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
              className="text-xs text-muted-foreground hover:text-destructive cursor-pointer w-full sm:w-auto"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              <span>Delete Lead</span>
            </Button>
          ) : (
            <div />
          )}

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
              className="cursor-pointer gap-1.5 text-xs flex-1 sm:flex-none"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Lead</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
