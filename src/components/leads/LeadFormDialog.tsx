import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { leadFormSchema } from "@/types/lead"
import type { LeadFormData, LeadItem } from "@/types/lead"
import { Building2, User, Phone, Mail, IndianRupee, Clock, Calendar, Sparkles } from "lucide-react"

interface LeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadToEdit?: LeadItem | null
  onSubmit: (data: LeadFormData) => void
}

const industryOptions = [
  "SaaS & Tech",
  "Fintech",
  "E-Commerce & D2C",
  "Healthcare & Biotech",
  "EdTech",
  "Design & Creative Studio",
  "Consumer & Media",
  "Other",
]

const sourceOptions = [
  "Twitter/X",
  "LinkedIn",
  "Referral",
  "Inbound Website",
  "Cold Outreach",
  "Event / Meetup",
]

const serviceOptions = [
  "Design System Architecture",
  "Full-Stack MVP Development",
  "Mobile App (iOS/Android)",
  "Brand Identity & Webflow",
  "SaaS UI/UX Revamp",
  "Monthly Engineering Retainer",
  "AI Integration & Dashboard",
]

export function LeadFormDialog({
  open,
  onOpenChange,
  leadToEdit,
  onSubmit,
}: LeadFormDialogProps) {
  const isEditing = Boolean(leadToEdit)

  // Default values
  const defaultValues: Partial<LeadFormData> = React.useMemo(() => {
    if (leadToEdit) {
      return {
        businessName: leadToEdit.businessName,
        contactPerson: leadToEdit.contactPerson,
        industry: leadToEdit.industry,
        location: leadToEdit.location,
        website: leadToEdit.website || "",
        email: leadToEdit.email,
        phone: leadToEdit.phone,
        source: leadToEdit.source,
        serviceInterest: leadToEdit.serviceInterest,
        estimatedValue: leadToEdit.estimatedValue,
        priority: leadToEdit.priority,
        status: leadToEdit.status,
        notes: leadToEdit.notes || "",
        nextFollowUpDate: leadToEdit.nextFollowUpDate,
        nextFollowUpTime: leadToEdit.nextFollowUpTime,
      }
    }
    // New lead defaults
    const today = new Date().toISOString().slice(0, 10)
    return {
      businessName: "",
      contactPerson: "",
      industry: "SaaS & Tech",
      location: "Bengaluru, KA",
      website: "",
      email: "",
      phone: "+91 ",
      source: "Inbound Website",
      serviceInterest: "Full-Stack MVP Development",
      estimatedValue: 250000,
      priority: "High",
      status: "New",
      notes: "",
      nextFollowUpDate: today,
      nextFollowUpTime: "15:00",
    }
  }, [leadToEdit, open])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues,
  })

  // Synchronize defaultValues when leadToEdit changes or dialog opens
  React.useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, defaultValues, reset])

  const handleFormSubmit = (data: LeadFormData) => {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>
                {isEditing ? `Edit Lead: ${leadToEdit?.businessName}` : "Create New Lead"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update client specifications, deal value in INR, and scheduled Indian follow-up."
                  : "Add a prospective client to your pipeline with full contact and deal metrics."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-160px)] pr-1.5 py-3">
            {/* Section 1: Business & Primary Contact */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span>Client & Company Profile</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="businessName" className="text-xs">
                    Business / Client Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="e.g. Apex Health Systems"
                    {...register("businessName")}
                    className={errors.businessName ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.businessName && (
                    <p className="text-[10px] text-destructive">{errors.businessName.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="contactPerson" className="text-xs">
                    Contact Person <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="contactPerson"
                      placeholder="e.g. Aditya Sharma"
                      className={`pl-8 ${errors.contactPerson ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      {...register("contactPerson")}
                    />
                  </div>
                  {errors.contactPerson && (
                    <p className="text-[10px] text-destructive">{errors.contactPerson.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="industry" className="text-xs">
                    Industry Domain <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="industry"
                    {...register("industry")}
                    className="flex h-8 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {industryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p className="text-[10px] text-destructive">{errors.industry.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="location" className="text-xs">
                    Location / City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g. Bengaluru, Mumbai, Gurugram"
                    {...register("location")}
                    className={errors.location ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.location && (
                    <p className="text-[10px] text-destructive">{errors.location.message}</p>
                  )}
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="website" className="text-xs">
                    Website URL (Optional)
                  </Label>
                  <Input
                    id="website"
                    placeholder="https://example.in"
                    {...register("website")}
                    className={errors.website ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.website && (
                    <p className="text-[10px] text-destructive">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Contact Channels */}
            <div className="pt-2 border-t border-border/60">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>Contact Channels</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="client@company.in"
                      className={`pl-8 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[10px] text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">
                    Phone / WhatsApp <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+91 98765 43210"
                      className={`pl-8 ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      {...register("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-[10px] text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Deal Value, Source & Service */}
            <div className="pt-2 border-t border-border/60">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5" />
                <span>Deal Potential (INR) & Scope</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="estimatedValue" className="text-xs">
                    Estimated Value (INR ₹) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id="estimatedValue"
                      type="number"
                      placeholder="250000"
                      className={`pl-7 font-mono font-medium ${errors.estimatedValue ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      {...register("estimatedValue", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.estimatedValue && (
                    <p className="text-[10px] text-destructive">{errors.estimatedValue.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="source" className="text-xs">
                    Lead Source <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="source"
                    {...register("source")}
                    className="flex h-8 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {sourceOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="serviceInterest" className="text-xs">
                    Service Focus <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="serviceInterest"
                    {...register("serviceInterest")}
                    className="flex h-8 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {serviceOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Pipeline Status, Priority & IST Follow-up */}
            <div className="pt-2 border-t border-border/60">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Status & Indian Follow-Up (IST)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="status" className="text-xs">
                    Pipeline Stage
                  </Label>
                  <select
                    id="status"
                    {...register("status")}
                    className="flex h-8 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="In Discovery">In Discovery</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="priority" className="text-xs">
                    Priority
                  </Label>
                  <select
                    id="priority"
                    {...register("priority")}
                    className="flex h-8 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="nextFollowUpDate" className="text-xs flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>Follow-Up Date</span>
                  </Label>
                  <Input
                    id="nextFollowUpDate"
                    type="date"
                    {...register("nextFollowUpDate")}
                    className={errors.nextFollowUpDate ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.nextFollowUpDate && (
                    <p className="text-[10px] text-destructive">{errors.nextFollowUpDate.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="nextFollowUpTime" className="text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      Time (IST)
                    </span>
                    <span className="text-[10px] text-muted-foreground">Asia/Kolkata</span>
                  </Label>
                  <Input
                    id="nextFollowUpTime"
                    type="time"
                    {...register("nextFollowUpTime")}
                    className={errors.nextFollowUpTime ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {errors.nextFollowUpTime && (
                    <p className="text-[10px] text-destructive">{errors.nextFollowUpTime.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Notes & Scope Details */}
            <div className="pt-2 border-t border-border/60 space-y-1">
              <Label htmlFor="notes" className="text-xs">
                Internal Strategy Notes & Context
              </Label>
              <Textarea
                id="notes"
                placeholder="Key discovery takeaways, client pain points, timeline expectations, tech stack preferences..."
                rows={3}
                {...register("notes")}
              />
            </div>
          </div>

          <DialogFooter className="mt-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="cursor-pointer gap-1.5 font-medium"
            >
              <span>{isEditing ? "Save Changes" : "Create Lead"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
