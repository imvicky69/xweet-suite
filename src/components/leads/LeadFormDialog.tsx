import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FlowDialog } from "@/components/ui/flow-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { leadFormSchema } from "@/types/lead"
import type { LeadFormData, LeadItem, LeadPriority, LeadStage } from "@/types/lead"
import { useWorkspace } from "@/context/WorkspaceContext"
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Pin,
} from "lucide-react"
import { toast } from "sonner"

function getTodayInTimezone(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  } catch {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }
}

function addDaysToDateStr(baseDateStr: string, days: number): string {
  try {
    const [y, m, d] = baseDateStr.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() + days)
    const newY = date.getFullYear()
    const newM = String(date.getMonth() + 1).padStart(2, "0")
    const newD = String(date.getDate()).padStart(2, "0")
    return `${newY}-${newM}-${newD}`
  } catch {
    return baseDateStr
  }
}

interface LeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadToEdit?: LeadItem | null
  onSubmit: (data: LeadFormData) => void
}

export function LeadFormDialog({
  open,
  onOpenChange,
  leadToEdit,
  onSubmit,
}: LeadFormDialogProps) {
  const isEditing = Boolean(leadToEdit)
  const [step, setStep] = React.useState(0)
  const TOTAL_STEPS = 6

  const {
    settings,
    formatCurrency,
    formatCompactCurrency,
    formatPhoneNumber,
    cleanDigitsOnly,
  } = useWorkspace()

  // Dynamic default values from active workspace preferences
  const defaultValues: Partial<LeadFormData> = React.useMemo(() => {
    const today = getTodayInTimezone(settings.timezone)
    if (leadToEdit) {
      return {
        businessName: leadToEdit.businessName,
        contactPerson: leadToEdit.contactPerson,
        industry: leadToEdit.industry,
        location: leadToEdit.location,
        website: leadToEdit.website || "",
        email: leadToEdit.email,
        phone: leadToEdit.phone || "",
        source: leadToEdit.source,
        serviceInterest: leadToEdit.serviceInterest,
        estimatedValue: leadToEdit.estimatedValue,
        priority: leadToEdit.priority,
        status: leadToEdit.status,
        notes: leadToEdit.notes || "",
        nextFollowUpDate: leadToEdit.nextFollowUpDate || today,
        nextFollowUpTime: leadToEdit.nextFollowUpTime || "14:30",
        showOnDashboard: leadToEdit.showOnDashboard ?? true,
        dashboardNote: leadToEdit.dashboardNote || "",
      }
    }
    return {
      businessName: "",
      contactPerson: "",
      industry: settings.industries[0] || "SaaS & Tech",
      location: settings.defaultLocation || "Bengaluru, KA",
      website: "",
      email: "",
      phone: "",
      source: "Inbound Website",
      serviceInterest: settings.services[0] || "Full-Stack MVP Development",
      estimatedValue: settings.valuePresets[1]?.val || 350000,
      priority: "High",
      status: "New",
      notes: "",
      nextFollowUpDate: today,
      nextFollowUpTime: "14:30",
      showOnDashboard: true,
      dashboardNote: "",
    }
  }, [leadToEdit, open, settings])

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues,
    mode: "onBlur",
  })

  const [contactError, setContactError] = React.useState("")

  // Synchronize when opening
  React.useEffect(() => {
    if (open) {
      reset(defaultValues)
      setStep(0)
      setContactError("")
    }
  }, [open, defaultValues, reset])

  const watched = watch()

  // Format phone according to active workspace country setting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactError("")
    const raw = e.target.value
    const digits = cleanDigitsOnly(raw)

    if (!digits) {
      setValue("phone", "", { shouldValidate: true })
    } else {
      setValue("phone", formatPhoneNumber(digits), { shouldValidate: true })
    }
  }

  // Validate step before advancing
  const handleNextStep = async () => {
    let isValid = false
    if (step === 0) {
      isValid = await trigger(["businessName"])
    } else if (step === 1) {
      isValid = await trigger(["contactPerson", "location"])
    } else if (step === 2) {
      // Flexible either/or contact validation
      const emailVal = (watched.email || "").trim()
      const rawDigits = cleanDigitsOnly(watched.phone || "")

      const hasEmail = emailVal.length > 0
      const hasPhone = rawDigits.length === settings.country.phoneDigits

      if (!hasEmail && !hasPhone) {
        setContactError(
          `Please provide at least one contact channel: an Email address or a ${settings.country.phoneDigits}-digit ${settings.country.name} Phone number.`
        )
        return
      }

      if (hasEmail) {
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)
        if (!isEmailValid) {
          setContactError("Please enter a valid email address.")
          return
        }
      }

      if (rawDigits.length > 0 && rawDigits.length !== settings.country.phoneDigits) {
        setContactError(
          `${settings.country.name} phone number must be exactly ${settings.country.phoneDigits} digits (e.g. ${settings.country.phonePlaceholder}).`
        )
        return
      }

      setContactError("")
      isValid = true
    } else if (step === 3) {
      isValid = await trigger(["industry", "serviceInterest"])
    } else if (step === 4) {
      isValid = await trigger(["estimatedValue"])
    } else {
      isValid = true
    }

    if (isValid && step < TOTAL_STEPS - 1) {
      setStep((prev) => prev + 1)
    }
  }

  const handlePrevStep = () => {
    setStep((prev) => Math.max(0, prev - 1))
  }

  // Handle Enter key inside inputs to advance
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (step === TOTAL_STEPS - 1) {
        handleFinalSubmit()
      } else {
        handleNextStep()
      }
    }
  }

  const handleFinalSubmit = handleSubmit((data: LeadFormData) => {
    const digits = cleanDigitsOnly(data.phone || "")
    const cleanedData: LeadFormData = {
      ...data,
      phone: digits.length >= 7 ? data.phone.trim() : "",
      email: data.email ? data.email.trim() : "",
      dashboardNote: (data.dashboardNote || data.notes || "").trim(),
      showOnDashboard: Boolean(data.showOnDashboard),
    }
    onSubmit(cleanedData)
    onOpenChange(false)
  })

  // Detect whether user made any changes across any step
  const hasUnsavedChanges = React.useMemo(() => {
    if (isEditing) {
      return isDirty || step > 0
    }
    // For new leads: check if user typed anything into any field or progressed to subsequent steps
    const hasBusinessName = Boolean(watched.businessName && watched.businessName.trim().length > 0)
    const hasContactPerson = Boolean(watched.contactPerson && watched.contactPerson.trim().length > 0)
    const hasEmail = Boolean(watched.email && watched.email.trim().length > 0)
    const rawDigits = cleanDigitsOnly(watched.phone || "")
    const hasPhone = rawDigits.length > 0
    const hasNotes = Boolean(watched.notes && watched.notes.trim().length > 0)
    return isDirty || step > 0 || hasBusinessName || hasContactPerson || hasEmail || hasPhone || hasNotes
  }, [isEditing, isDirty, step, watched, cleanDigitsOnly])

  // Discard all changes and reset form
  const handleDiscard = () => {
    reset(defaultValues)
    setStep(0)
    setContactError("")
    toast.info("Changes discarded")
  }

  // Quick Save when user chooses 'Save' from exit prompt
  const handleQuickSave = async () => {
    const isBusinessValid = await trigger(["businessName"])
    if (!isBusinessValid) {
      setStep(0)
      toast.error("Please enter a business name to save this lead")
      return
    }

    if (!watched.contactPerson || watched.contactPerson.trim().length < 2) {
      setStep(1)
      toast.error("Please enter the contact person's name to save")
      return
    }

    const emailVal = (watched.email || "").trim()
    const rawDigits = cleanDigitsOnly(watched.phone || "")
    const hasEmail = emailVal.length > 0
    const hasPhone = rawDigits.length === settings.country.phoneDigits

    if (!hasEmail && !hasPhone) {
      setStep(2)
      toast.error(
        `Please provide an email or ${settings.country.phoneDigits}-digit phone number to save`
      )
      return
    }

    handleFinalSubmit()
  }

  return (
    <FlowDialog
      open={open}
      onOpenChange={onOpenChange}
      totalSteps={TOTAL_STEPS}
      currentStep={step}
      onNext={handleNextStep}
      onPrev={handlePrevStep}
      onSubmit={handleFinalSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEditing ? "Save Changes" : "Create Lead"}
      badgeText={isEditing ? "Editing Lead" : "New Lead"}
      hasUnsavedChanges={hasUnsavedChanges}
      onDiscard={handleDiscard}
      onSave={handleQuickSave}
    >
      <div onKeyDown={handleKeyDown} className="w-full">
        {/* STEP 0: Business Name */}
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                What is the business or client company name?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enter the official organization name, brand, or client startup.
              </p>
            </div>

            <div className="pt-2">
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="e.g. Acme Technologies, Hyperion SaaS"
                  className={`h-13 pl-11 text-base sm:text-lg font-medium bg-card shadow-xs ${
                    errors.businessName ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  {...register("businessName")}
                  autoFocus
                />
              </div>
              {errors.businessName && (
                <p className="text-xs text-destructive mt-1.5 font-medium">{errors.businessName.message}</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: Contact Person & City */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Who is the primary contact, and where are they based?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Decision maker or manager name, and operating city.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. Aditya Sharma"
                    className={`h-11 pl-10 text-sm font-medium ${errors.contactPerson ? "border-destructive" : ""}`}
                    {...register("contactPerson")}
                    autoFocus
                  />
                </div>
                {errors.contactPerson && (
                  <p className="text-xs text-destructive mt-1">{errors.contactPerson.message}</p>
                )}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">City / Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`e.g. ${settings.cityPresets.slice(0, 3).join(", ")}`}
                    className={`h-11 pl-10 text-sm font-medium ${errors.location ? "border-destructive" : ""}`}
                    {...register("location")}
                  />
                </div>
                {errors.location && (
                  <p className="text-xs text-destructive mt-1">{errors.location.message}</p>
                )}
              </div>

              {/* Quick City Presets from Settings */}
              {settings.cityPresets.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground mr-1">Quick Cities:</span>
                  {settings.cityPresets.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("location", c, { shouldValidate: true })}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                        watched.location === c
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Direct Contact Channels (Workspace Phone Standards) */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                How can you reach them directly?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Provide client email or {settings.country.name} mobile number ({settings.country.callingCode}). At least one contact method is required.
              </p>
            </div>

            {/* Error banner if neither is provided */}
            {contactError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">
                {contactError}
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-muted-foreground block">Email Address</Label>
                  <span className="text-[10px] text-muted-foreground/70">
                    {cleanDigitsOnly(watched.phone || "").length === settings.country.phoneDigits
                      ? "Optional (Phone provided)"
                      : "Required if no phone"}
                  </span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="client@company.com"
                    value={watched.email || ""}
                    onChange={(e) => {
                      setContactError("")
                      setValue("email", e.target.value, { shouldValidate: true })
                    }}
                    className={`h-11 pl-10 text-sm font-medium ${errors.email ? "border-destructive" : ""}`}
                    autoFocus
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-muted-foreground block">
                    Phone / WhatsApp ({settings.country.callingCode})
                  </Label>
                  <span className="text-[10px] text-muted-foreground/70">
                    {watched.email && watched.email.trim().length > 0
                      ? "Optional (Email provided)"
                      : `Max ${settings.country.phoneDigits} digits`}
                  </span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={settings.country.phonePlaceholder}
                    value={watched.phone || ""}
                    onChange={handlePhoneChange}
                    maxLength={20}
                    className={`h-11 pl-10 text-sm font-medium ${errors.phone ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* WhatsApp Feature Highlight */}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-xs shrink-0">
                  WA
                </span>
                <p className="text-emerald-700 dark:text-emerald-400 font-medium text-xs">
                  {settings.country.name} {settings.country.phoneDigits}-digit number automatically activates 1-click WhatsApp messaging on mobile cards & CRM table.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Industry & Service Deliverable (Configurable in Settings) */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                What industry and service focus does this deal entail?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select from your workspace's configured industry domains and core project deliverables.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Industry Domain</Label>
                <div className="flex flex-wrap gap-1.5">
                  {settings.industries.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setValue("industry", ind, { shouldValidate: true })}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${
                        watched.industry === ind
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Service Deliverable</Label>
                <div className="flex flex-wrap gap-1.5">
                  {settings.services.map((srv) => (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => setValue("serviceInterest", srv, { shouldValidate: true })}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${
                        watched.serviceInterest === srv
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {srv}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Estimated Deal Value (Workspace Currency) */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                What is the estimated contract budget in {settings.currency.code}?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select a quick preset or type custom {settings.currency.name} amount.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground font-mono">
                  {settings.currency.symbol}
                </span>
                <Input
                  type="number"
                  placeholder="350000"
                  className={`h-14 pl-10 pr-24 font-mono font-bold text-xl sm:text-2xl bg-card shadow-xs ${
                    errors.estimatedValue ? "border-destructive" : ""
                  }`}
                  {...register("estimatedValue", { valueAsNumber: true })}
                  autoFocus
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <Badge variant="indigo" size="default" className="font-mono text-xs font-semibold">
                    {formatCompactCurrency(Number(watched.estimatedValue) || 0)}
                  </Badge>
                </div>
              </div>

              {/* Quick Presets from Workspace Settings */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground mr-1">Quick Presets:</span>
                {settings.valuePresets.map((vp) => (
                  <button
                    key={vp.label}
                    type="button"
                    onClick={() => setValue("estimatedValue", vp.val, { shouldValidate: true })}
                    className={`rounded-md px-3 py-1 text-xs font-mono font-semibold border transition-all cursor-pointer ${
                      watched.estimatedValue === vp.val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {vp.label}
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-border/80 bg-secondary/30 p-3 text-xs">
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                  Standard {settings.currency.name} Valuation:
                </span>
                <span className="font-mono font-bold text-lg text-primary">
                  {formatCurrency(Number(watched.estimatedValue) || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Status, Follow-up & Review */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Set pipeline stage, follow-up schedule & review
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select deal status, priority urgency, scheduled touchpoint, and save notes.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {/* Pipeline Stage */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Pipeline Stage</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(["New", "In Discovery", "Proposal Sent", "Negotiation", "Won"] as LeadStage[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setValue("status", st)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                        watched.status === st
                          ? "bg-primary text-primary-foreground border-primary font-semibold"
                          : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Urgency */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Priority Urgency</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(["Urgent", "High", "Medium", "Low"] as LeadPriority[]).map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setValue("priority", pr)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                        watched.priority === pr
                          ? "bg-primary text-primary-foreground border-primary font-semibold"
                          : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Follow-up Schedule & Quick Presets */}
              <div className="rounded-xl border border-border/80 bg-secondary/20 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>Follow-Up Schedule</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Quick 1-tap reminders:
                  </span>
                </div>

                {/* Quick Date Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Today", days: 0 },
                    { label: "Tomorrow", days: 1 },
                    { label: "In 3 Days", days: 3 },
                    { label: "In 1 Week", days: 7 },
                    { label: "In 2 Weeks", days: 14 },
                    { label: "In 1 Month", days: 30 },
                  ].map((p) => {
                    const todayInZone = getTodayInTimezone(settings.timezone)
                    const targetDate = addDaysToDateStr(todayInZone, p.days)
                    const isSelected = watched.nextFollowUpDate === targetDate

                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setValue("nextFollowUpDate", targetDate, { shouldValidate: true })}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                            : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1 block">
                      Target Date (No past dates)
                    </Label>
                    <Input
                      type="date"
                      min={getTodayInTimezone(settings.timezone)}
                      className="h-9 text-xs bg-card"
                      {...register("nextFollowUpDate")}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1 block flex items-center justify-between">
                      <span>Touchpoint Time</span>
                      <span className="text-[10px] text-muted-foreground">
                        {settings.timezoneLabel.split(" ")[0]}
                      </span>
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="time"
                        className="h-9 text-xs bg-card flex-1"
                        {...register("nextFollowUpTime")}
                      />
                      <div className="flex gap-1 shrink-0">
                        {[
                          { label: "10 AM", val: "10:30" },
                          { label: "2:30 PM", val: "14:30" },
                          { label: "5 PM", val: "17:00" },
                        ].map((t) => (
                          <button
                            key={t.label}
                            type="button"
                            onClick={() => setValue("nextFollowUpTime", t.val)}
                            className={`rounded px-1.5 py-1 text-[10px] font-mono border transition-colors cursor-pointer ${
                              watched.nextFollowUpTime === t.val
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border hover:text-foreground"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Reminder Note & Pin Toggle */}
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1 block">
                      Follow-up Note / Context
                    </Label>
                    <Input
                      placeholder="e.g. Call Sofia to review Webflow prototype & contract terms"
                      className="h-9 text-xs bg-card"
                      {...register("dashboardNote")}
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(watched.showOnDashboard)}
                      onChange={(e) => setValue("showOnDashboard", e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                      <Pin className="h-3.5 w-3.5 text-primary" />
                      <span>Show this follow-up reminder on Dashboard</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Live Recap Card */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-xs flex items-center justify-between">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground truncate">
                      {watched.businessName || "Client"}
                    </span>
                    <Badge variant="indigo" size="sm">
                      {watched.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {watched.contactPerson} • {watched.location} • {watched.serviceInterest}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                    Estimated Deal
                  </span>
                  <span className="font-mono font-bold text-base text-foreground">
                    {formatCurrency(Number(watched.estimatedValue) || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FlowDialog>
  )
}
