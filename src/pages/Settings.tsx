import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  useWorkspace,
  COUNTRY_PRESETS,
  CURRENCY_PRESETS,
  TIMEZONE_PRESETS,
  getDefaultValuePresets,
} from "@/context/WorkspaceContext"
import type { CountryConfig, CurrencyConfig } from "@/context/WorkspaceContext"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Building2,
  Globe,
  Coins,
  Phone,
  CheckCircle2,
  RotateCcw,
  Save,
  Plus,
  X,
  Sparkles,
  ShieldCheck,
  User,
  Users,
  Copy,
  Check,
  Mail,
  Shield,
  Sliders,
  LogOut,
  Send,
  Trash2,
  Briefcase,
} from "lucide-react"
import { AppLogo } from "@/components/ui/app-logo"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import {
  getWorkspaceUsers,
  addCoworker,
  removeWorkspaceUser,
  updateWorkspaceUser,
  resendPortalInvite,
} from "@/data/users"
import type {
  WorkspaceUser,
  UserRole,
  UserDepartment,
} from "@/types/user"
import {
  ROLE_PERMISSIONS_MAP,
  getRoleBadgeVariant,
  getStatusBadgeVariant,
} from "@/types/user"

type SettingsTab = "profile" | "team" | "workspace" | "regional" | "presets"

export default function Settings() {
  const navigate = useNavigate()
  const {
    settings,
    updateSettings,
    resetSettings,
    formatCurrency,
    formatCompactCurrency,
    formatPhoneNumber,
  } = useWorkspace()

  // Active Tab
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile")

  // Local draft state for pristine editing experience
  const [formData, setFormData] = React.useState(settings)
  const [hasChanges, setHasChanges] = React.useState(false)

  // Team & Co-workers management
  const [members, setMembers] = React.useState<WorkspaceUser[]>(() =>
    getWorkspaceUsers({
      name: settings.accountOwnerName || "Workspace Admin",
      email: settings.accountEmail || "admin@workspace.com",
    })
  )
  const [isInviteOpen, setIsInviteOpen] = React.useState(false)
  const [inviteName, setInviteName] = React.useState("")
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState<UserRole>("member")
  const [inviteTitle, setInviteTitle] = React.useState("")
  const [inviteDepartment, setInviteDepartment] = React.useState<UserDepartment>("Operations")

  // Copy UID feedback
  const [copiedUid, setCopiedUid] = React.useState(false)

  // Quick inputs for tags & presets
  const [newIndustry, setNewIndustry] = React.useState("")
  const [newService, setNewService] = React.useState("")
  const [newCity, setNewCity] = React.useState("")
  const [newPresetAmount, setNewPresetAmount] = React.useState("")
  const [newPresetLabel, setNewPresetLabel] = React.useState("")

  // Live test phone preview
  const [testPhoneInput, setTestPhoneInput] = React.useState("9876543210")

  // Sync if context updates externally
  React.useEffect(() => {
    setFormData(settings)
    setHasChanges(false)
  }, [settings])

  // Sync team members on storage event
  React.useEffect(() => {
    const handleStorage = () => {
      setMembers(
        getWorkspaceUsers({
          name: settings.accountOwnerName,
          email: settings.accountEmail,
        })
      )
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [settings.accountOwnerName, settings.accountEmail])

  const handleChange = <K extends keyof typeof formData>(key: K, value: typeof formData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Country selection handler
  const handleCountrySelect = (country: CountryConfig) => {
    const updated = {
      ...formData,
      country,
    }
    if (country.code === "IN") {
      updated.currency = CURRENCY_PRESETS.find((c) => c.code === "INR") || updated.currency
      updated.timezone = "Asia/Kolkata"
      updated.timezoneLabel = "IST (UTC+5:30)"
      updated.valuePresets = getDefaultValuePresets("INR", "₹")
    } else if (country.code === "US") {
      updated.currency = CURRENCY_PRESETS.find((c) => c.code === "USD") || updated.currency
      updated.timezone = "America/New_York"
      updated.timezoneLabel = "EST (UTC-5)"
      updated.valuePresets = getDefaultValuePresets("USD", "$")
    } else if (country.code === "GB") {
      updated.currency = CURRENCY_PRESETS.find((c) => c.code === "GBP") || updated.currency
      updated.timezone = "Europe/London"
      updated.timezoneLabel = "GMT (UTC+0)"
      updated.valuePresets = getDefaultValuePresets("GBP", "£")
    } else if (country.code === "AE") {
      updated.currency = CURRENCY_PRESETS.find((c) => c.code === "AED") || updated.currency
      updated.timezone = "Asia/Dubai"
      updated.timezoneLabel = "GST (UTC+4)"
      updated.valuePresets = getDefaultValuePresets("AED", "AED")
    } else if (country.code === "SG") {
      updated.currency = CURRENCY_PRESETS.find((c) => c.code === "SGD") || updated.currency
      updated.timezone = "Asia/Singapore"
      updated.timezoneLabel = "SGT (UTC+8)"
      updated.valuePresets = getDefaultValuePresets("SGD", "S$")
    } else if (country.code === "DE") {
      updated.currency = CURRENCY_PRESETS.find((c) => c.code === "EUR") || updated.currency
      updated.timezone = "Europe/Berlin"
      updated.timezoneLabel = "CET (UTC+1)"
      updated.valuePresets = getDefaultValuePresets("EUR", "€")
    }

    setFormData(updated)
    setHasChanges(true)
  }

  // Currency selection handler
  const handleCurrencySelect = (currency: CurrencyConfig) => {
    setFormData((prev) => ({
      ...prev,
      currency,
      valuePresets: getDefaultValuePresets(currency.code, currency.symbol),
    }))
    setHasChanges(true)
  }

  // Timezone selection handler
  const handleTimezoneSelect = (tzId: string) => {
    const found = TIMEZONE_PRESETS.find((t) => t.id === tzId)
    setFormData((prev) => ({
      ...prev,
      timezone: tzId,
      timezoneLabel: found ? found.label.split(" - ")[0] : tzId,
    }))
    setHasChanges(true)
  }

  // Save handler
  const handleSave = () => {
    updateSettings(formData)
    setHasChanges(false)
    toast.success("Workspace preferences saved!", {
      description: "User profile, currency, and deal settings have been updated.",
    })
  }

  // Reset handler
  const handleReset = () => {
    resetSettings()
    toast.info("Preferences restored to default")
  }

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast.success("Signed out successfully")
      navigate("/login")
    } catch {
      navigate("/login")
    }
  }

  // Copy UID helper
  const handleCopyUid = () => {
    const uid = auth.currentUser?.uid || "admin-session-active"
    navigator.clipboard.writeText(uid)
    setCopiedUid(true)
    toast.success("User ID copied to clipboard")
    setTimeout(() => setCopiedUid(false), 2000)
  }

  // Add co-worker handler
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Please provide both name and email")
      return
    }

    const newMember = addCoworker(
      {
        fullName: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        title: inviteTitle.trim() || "Team Member",
        department: inviteDepartment,
      },
      formData.accountOwnerName || "Admin"
    )

    setMembers(getWorkspaceUsers())
    setIsInviteOpen(false)
    setInviteName("")
    setInviteEmail("")
    setInviteTitle("")
    toast.success(`Invitation sent to ${newMember.email}`, {
      description: `Role assigned: ${newMember.role.toUpperCase()}`,
    })
  }

  const handleRemoveMember = (id: string, name: string) => {
    const success = removeWorkspaceUser(id)
    if (success) {
      setMembers(getWorkspaceUsers())
      toast.info(`Removed ${name} from workspace`)
    } else {
      toast.error("Primary workspace owner cannot be removed")
    }
  }

  const handleRoleChange = (id: string, role: UserRole) => {
    updateWorkspaceUser(id, { role })
    setMembers(getWorkspaceUsers())
    toast.success("Role updated successfully")
  }

  // Tag list managers
  const addIndustry = () => {
    if (!newIndustry.trim()) return
    if (formData.industries.includes(newIndustry.trim())) return
    setFormData((prev) => ({
      ...prev,
      industries: [...prev.industries, newIndustry.trim()],
    }))
    setNewIndustry("")
    setHasChanges(true)
  }

  const removeIndustry = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      industries: prev.industries.filter((i) => i !== item),
    }))
    setHasChanges(true)
  }

  const addService = () => {
    if (!newService.trim()) return
    if (formData.services.includes(newService.trim())) return
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, newService.trim()],
    }))
    setNewService("")
    setHasChanges(true)
  }

  const removeService = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s !== item),
    }))
    setHasChanges(true)
  }

  const addCity = () => {
    if (!newCity.trim()) return
    if (formData.cityPresets.includes(newCity.trim())) return
    setFormData((prev) => ({
      ...prev,
      cityPresets: [...prev.cityPresets, newCity.trim()],
    }))
    setNewCity("")
    setHasChanges(true)
  }

  const removeCity = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      cityPresets: prev.cityPresets.filter((c) => c !== item),
    }))
    setHasChanges(true)
  }

  const addValuePreset = () => {
    const val = Number(newPresetAmount)
    if (!val || isNaN(val) || val <= 0) {
      toast.error("Please enter a valid numeric deal amount")
      return
    }
    const label = newPresetLabel.trim() || formatCompactCurrency(val)
    if (formData.valuePresets.some((p) => p.val === val)) {
      toast.error("A pricing preset with this value already exists")
      return
    }
    const updated = [...formData.valuePresets, { label, val }].sort((a, b) => a.val - b.val)
    setFormData((prev) => ({
      ...prev,
      valuePresets: updated,
    }))
    setNewPresetAmount("")
    setNewPresetLabel("")
    setHasChanges(true)
    toast.success(`Added preset "${label}"`)
  }

  const removeValuePreset = (val: number) => {
    if (formData.valuePresets.length <= 1) {
      toast.error("You must keep at least one pricing preset")
      return
    }
    setFormData((prev) => ({
      ...prev,
      valuePresets: prev.valuePresets.filter((p) => p.val !== val),
    }))
    setHasChanges(true)
  }

  // Current clock preview for selected timezone
  const currentTimeInZone = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: formData.timezone,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date())
    } catch {
      return new Date().toLocaleTimeString()
    }
  }, [formData.timezone])

  // Get user avatar initials
  const userInitials = React.useMemo(() => {
    const name = formData.accountOwnerName || "Admin"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }, [formData.accountOwnerName])

  const userRole = (formData.role || "admin").toLowerCase() as UserRole
  const permissions = ROLE_PERMISSIONS_MAP[userRole] || ROLE_PERMISSIONS_MAP.admin
  const currentUid = auth.currentUser?.uid || "admin-local-active"
  const currentEmail = formData.accountEmail || auth.currentUser?.email || "admin@workspace.com"

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto pb-28">
      {/* Top Header & Save Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Settings & Preferences
            </h1>
            <Badge variant="indigo" size="sm" className="font-medium">
              {formData.plan || "Pro Tier"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your account identity, team co-workers, workspace branding, and regional standards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
            className="gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{hasChanges ? "Save Changes" : "Saved"}</span>
          </Button>
        </div>
      </div>

      {/* Floating Save Reminder banner if modified */}
      {hasChanges && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 flex items-center justify-between gap-3 text-xs animate-in fade-in-50">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>You have unsaved changes in your preferences.</span>
          </div>
          <Button size="xs" onClick={handleSave} className="cursor-pointer">
            Save Now
          </Button>
        </div>
      )}

      {/* Navigation Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/60 pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "profile"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>My Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "team"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Team & Co-workers</span>
          <span
            className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === "team" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("workspace")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "workspace"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Workspace & Brand</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("regional")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "regional"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>Regional & Currency</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "presets"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Deal Flow Presets</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: MY PROFILE (LOGGED IN USER DETAILS)                      */}
      {/* ============================================================== */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* User Hero Identity Card */}
          <Card className="border-border/80 shadow-xs bg-gradient-to-r from-card via-card to-primary/5">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {/* Avatar / Initials */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl font-bold shadow-sm">
                    {userInitials}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-foreground">
                        {formData.accountOwnerName || "Workspace Owner"}
                      </h2>
                      <Badge variant="default" size="sm" className="gap-1 font-semibold uppercase text-[10px]">
                        <Shield className="h-2.5 w-2.5" />
                        {userRole}
                      </Badge>
                      {formData.trialActive && (
                        <Badge variant="indigo" size="sm" className="gap-1 font-semibold text-[10px]">
                          <Sparkles className="h-2.5 w-2.5" />
                          14-Day Pro Trial Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{currentEmail}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="h-2.5 w-2.5" /> Verified
                      </span>
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        UID: {currentUid.slice(0, 16)}...
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUid}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        {copiedUid ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedUid ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Profile Form & Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>Personal Profile</span>
                </CardTitle>
                <CardDescription>
                  Your display identity seen by co-workers and on client deliverables.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block">Full Name</Label>
                  <Input
                    value={formData.accountOwnerName}
                    onChange={(e) => handleChange("accountOwnerName", e.target.value)}
                    placeholder="e.g. Vicky Verma"
                    className="h-9 text-xs font-medium"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block">Primary Work Email</Label>
                  <Input
                    value={formData.accountEmail}
                    onChange={(e) => handleChange("accountEmail", e.target.value)}
                    placeholder="you@company.com"
                    className="h-9 text-xs font-medium"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Used for workspace security notifications and system alerts.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block">Title / Designation</Label>
                    <Input
                      value={formData.role || "Founder & Workspace Admin"}
                      onChange={(e) => handleChange("role", e.target.value)}
                      placeholder="e.g. Founder & Lead Architect"
                      className="h-9 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block">Base Location</Label>
                    <Input
                      value={formData.defaultLocation}
                      onChange={(e) => handleChange("defaultLocation", e.target.value)}
                      placeholder="e.g. Bengaluru, KA"
                      className="h-9 text-xs font-medium"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role & Permissions Breakdown */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>Role & Portal Capabilities</span>
                    </CardTitle>
                    <CardDescription>
                      Security authorizations active on this session.
                    </CardDescription>
                  </div>
                  <Badge variant="indigo" size="sm" className="font-semibold capitalize">
                    {userRole} Level
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 border border-border/50">
                    <CheckCircle2 className={`h-4 w-4 ${permissions.canManagePortal ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <span className="font-medium text-foreground">Manage Portal</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 border border-border/50">
                    <CheckCircle2 className={`h-4 w-4 ${permissions.canAddMembers ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <span className="font-medium text-foreground">Add Co-workers</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 border border-border/50">
                    <CheckCircle2 className={`h-4 w-4 ${permissions.canManageBilling ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <span className="font-medium text-foreground">Billing & Plans</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 border border-border/50">
                    <CheckCircle2 className={`h-4 w-4 ${permissions.canDeleteLeads ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <span className="font-medium text-foreground">Delete Leads</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 border border-border/50">
                    <CheckCircle2 className={`h-4 w-4 ${permissions.canExportData ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <span className="font-medium text-foreground">Export Data</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 border border-border/50">
                    <CheckCircle2 className={`h-4 w-4 ${permissions.canViewFinancialReports ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <span className="font-medium text-foreground">Financial Reports</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Authentication Provider:</span>
                  <span className="font-semibold text-foreground">
                    {auth.currentUser?.providerData[0]?.providerId === "google.com" ? "Google OAuth 2.0" : "Email & Password"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TEAM & CO-WORKERS (PORTAL MANAGEMENT)                   */}
      {/* ============================================================== */}
      {activeTab === "team" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Workspace Co-workers & Team Access</span>
                  </CardTitle>
                  <CardDescription>
                    Invite colleagues, assign operational roles, and manage permissions on your portal.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsInviteOpen(true)}
                  className="gap-1.5 text-xs font-semibold cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Invite Co-worker</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {members.map((member) => {
                  const initials = member.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                  const isOwner = member.role === "admin"

                  return (
                    <div
                      key={member.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs">
                          {initials}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-foreground truncate">
                              {member.fullName}
                            </span>
                            <Badge variant={getRoleBadgeVariant(member.role)} size="sm" className="text-[10px] font-semibold uppercase">
                              {member.role}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(member.status)} size="sm" className="text-[10px] capitalize">
                              {member.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {member.email} • {member.title} ({member.department})
                          </p>
                        </div>
                      </div>

                      {/* Member Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {/* Change Role Selector for Co-workers */}
                        {!isOwner && (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                            aria-label={`Change role for ${member.fullName}`}
                            className="h-7 text-[11px] rounded border border-border/80 bg-card px-2 text-foreground font-medium cursor-pointer"
                          >
                            <option value="manager">Manager</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        )}

                        {member.status === "invited" && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              resendPortalInvite(member.id)
                              toast.success(`Resent invitation to ${member.email}`)
                            }}
                            className="gap-1 text-xs text-primary hover:text-primary/80 cursor-pointer"
                          >
                            <Send className="h-3 w-3" />
                            <span>Resend</span>
                          </Button>
                        )}

                        {!isOwner && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveMember(member.id, member.fullName)}
                            title="Remove co-worker"
                            className="text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: WORKSPACE & BRAND                                       */}
      {/* ============================================================== */}
      {activeTab === "workspace" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Workspace Organization</span>
                </CardTitle>
                <CardDescription>Legal entity details and workspace name.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block">Workspace Name</Label>
                  <Input
                    value={formData.workspaceName}
                    onChange={(e) => handleChange("workspaceName", e.target.value)}
                    placeholder="e.g. Acme HQ"
                    className="h-9 text-xs font-medium"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block">Company / Agency Name</Label>
                  <Input
                    value={formData.companyName || formData.workspaceName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    placeholder="e.g. Acme Creative Studio Pvt Ltd"
                    className="h-9 text-xs font-medium"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block">Team Size</Label>
                  <Input
                    value={formData.teamSize || "1-5"}
                    onChange={(e) => handleChange("teamSize", e.target.value)}
                    placeholder="e.g. 5-10 members"
                    className="h-9 text-xs font-medium"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>Use-Case & Brand Identity</span>
                </CardTitle>
                <CardDescription>Logo vector asset and operating business model.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="rounded-lg border border-border/80 bg-secondary/30 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AppLogo variant="dark" size="sm" />
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Workspace Vector Logo</span>
                      <span className="text-[10px] text-muted-foreground">High-contrast SVG & PNG format</span>
                    </div>
                  </div>
                  <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                    /clear.png
                  </Badge>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block">Operating Business Model</Label>
                  <Input
                    value={formData.useCase || "Freelancing"}
                    onChange={(e) => handleChange("useCase", e.target.value as any)}
                    placeholder="e.g. Agency, Freelancing, SaaS"
                    className="h-9 text-xs font-medium"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Customizes default deal stages and client milestone types.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: REGIONAL & CURRENCY                                     */}
      {/* ============================================================== */}
      {activeTab === "regional" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Country Calling Code Card */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Country & Calling Code Standards</CardTitle>
                    <CardDescription>
                      Default country prefix and max digits enforcement for phone inputs & WhatsApp.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="neutral" size="sm" className="font-mono">
                  {formData.country.callingCode} · {formData.country.phoneDigits} Digits
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-2 block">
                  Select Operating Country
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {COUNTRY_PRESETS.map((c) => {
                    const isSelected = formData.country.code === c.code
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleCountrySelect(c)}
                        className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                            : "border-border/80 bg-card hover:bg-secondary/70 hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-lg">{c.flag}</span>
                          <span className="text-[11px] font-mono font-semibold text-foreground">
                            {c.callingCode}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-foreground truncate w-full">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {c.phoneDigits} digits max
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Interactive Phone Format Preview Box */}
              <div className="rounded-lg border border-border/80 bg-secondary/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Live Phone & WhatsApp Preview
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Try typing digits below
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Input
                      value={testPhoneInput}
                      onChange={(e) => setTestPhoneInput(e.target.value)}
                      placeholder="Type digits to test..."
                      className="h-8 text-xs font-mono bg-card"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-border text-xs font-mono text-foreground font-semibold shrink-0">
                    <span>Formatted:</span>
                    <span className="text-primary">
                      {formatPhoneNumber(testPhoneInput)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Currency Presentation Card */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Currency & Financial Presentation</CardTitle>
                    <CardDescription>
                      Sets pipeline currency symbols and numbering conventions (Indian Lakhs/Crores vs Millions).
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="indigo" size="sm" className="font-mono">
                  {formData.currency.symbol} {formData.currency.code} ({formData.currency.notation})
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {CURRENCY_PRESETS.map((curr) => {
                  const isSelected = formData.currency.code === curr.code
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => handleCurrencySelect(curr)}
                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                          : "border-border/80 bg-card hover:bg-secondary/70 hover:border-border"
                      }`}
                    >
                      <span className="text-sm font-bold font-mono text-primary mb-0.5">
                        {curr.symbol} {curr.code}
                      </span>
                      <span className="text-xs font-medium text-foreground truncate w-full">
                        {curr.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {curr.notation} format
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Timezone & Clock card */}
              <div className="pt-3 border-t border-border/50">
                <Label className="text-xs font-semibold text-foreground mb-1 block">Active Timezone</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleTimezoneSelect(e.target.value)}
                    aria-label="Select Active Timezone"
                    className="h-9 text-xs rounded-md border border-border/80 bg-card px-3 text-foreground font-medium cursor-pointer"
                  >
                    {TIMEZONE_PRESETS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between p-2 rounded-md bg-secondary/40 border border-border/60 text-xs">
                    <span className="text-muted-foreground">Clock in zone:</span>
                    <span className="font-mono font-semibold text-foreground">{currentTimeInZone}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: DEAL FLOW PRESETS                                       */}
      {/* ============================================================== */}
      {activeTab === "presets" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <span>Deal Presets & Quick Tag Lists</span>
              </CardTitle>
              <CardDescription>
                Dropdown choices prefilled across Lead Creation and Deal Management.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Industries */}
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Industry Sectors ({formData.industries.length})
                </Label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {formData.industries.map((ind) => (
                    <Badge key={ind} variant="neutral" size="sm" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs">
                      <span>{ind}</span>
                      <button
                        type="button"
                        onClick={() => removeIndustry(ind)}
                        className="hover:text-destructive text-muted-foreground p-0.5 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 max-w-md">
                  <Input
                    placeholder="Add industry (e.g. AI & Robotics)"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addIndustry()
                      }
                    }}
                    className="h-8 text-xs bg-card"
                  />
                  <Button size="xs" variant="secondary" onClick={addIndustry} className="gap-1 px-3 cursor-pointer shrink-0">
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>

              {/* Service Deliverables */}
              <div className="pt-4 border-t border-border/50">
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Service Deliverables ({formData.services.length})
                </Label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {formData.services.map((srv) => (
                    <Badge key={srv} variant="indigo" size="sm" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs">
                      <span>{srv}</span>
                      <button
                        type="button"
                        onClick={() => removeService(srv)}
                        className="hover:text-destructive text-muted-foreground p-0.5 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 max-w-md">
                  <Input
                    placeholder="Add service (e.g. Mobile App Dev)"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addService()
                      }
                    }}
                    className="h-8 text-xs bg-card"
                  />
                  <Button size="xs" variant="secondary" onClick={addService} className="gap-1 px-3 cursor-pointer shrink-0">
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>

              {/* City Presets */}
              <div className="pt-4 border-t border-border/50">
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Quick City Presets ({formData.cityPresets.length})
                </Label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {formData.cityPresets.map((city) => (
                    <Badge key={city} variant="neutral" size="sm" className="gap-1 pl-2.5 pr-1.5 py-1 text-xs">
                      <span>{city}</span>
                      <button
                        type="button"
                        onClick={() => removeCity(city)}
                        className="hover:text-destructive text-muted-foreground p-0.5 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 max-w-md">
                  <Input
                    placeholder="Add city preset (e.g. Pune, MH)"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCity()
                      }
                    }}
                    className="h-8 text-xs bg-card"
                  />
                  <Button size="xs" variant="secondary" onClick={addCity} className="gap-1 px-3 cursor-pointer shrink-0">
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>

              {/* Pricing Presets */}
              <div className="pt-4 border-t border-border/50">
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Deal Valuation Presets ({formData.valuePresets.length})
                </Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.valuePresets.map((vp) => (
                    <div
                      key={vp.val}
                      className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/30 px-3 py-1.5 text-xs"
                    >
                      <span className="font-semibold text-foreground">{vp.label}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">({formatCurrency(vp.val)})</span>
                      <button
                        type="button"
                        onClick={() => removeValuePreset(vp.val)}
                        className="hover:text-destructive text-muted-foreground p-0.5 cursor-pointer ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
                  <Input
                    type="number"
                    placeholder="Amount (e.g. 500000)"
                    value={newPresetAmount}
                    onChange={(e) => setNewPresetAmount(e.target.value)}
                    className="h-8 text-xs bg-card font-mono"
                  />
                  <Input
                    placeholder="Label (optional, e.g. ₹5L)"
                    value={newPresetLabel}
                    onChange={(e) => setNewPresetLabel(e.target.value)}
                    className="h-8 text-xs bg-card"
                  />
                  <Button size="xs" variant="secondary" onClick={addValuePreset} className="gap-1 px-3 cursor-pointer shrink-0">
                    <Plus className="h-3 w-3" />
                    <span>Add Preset</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Co-worker Modal Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent maxWidth="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>Invite Co-worker</DialogTitle>
                <DialogDescription>
                  Send a portal invitation and assign permissions.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1 block">Full Name</Label>
              <Input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                required
                className="h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground mb-1 block">Work Email</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="priya@company.com"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1 block">Portal Role</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full h-9 text-xs rounded-md border border-border/80 bg-card px-2.5 text-foreground font-medium"
                >
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground mb-1 block">Department</Label>
                <select
                  value={inviteDepartment}
                  onChange={(e) => setInviteDepartment(e.target.value as UserDepartment)}
                  className="w-full h-9 text-xs rounded-md border border-border/80 bg-card px-2.5 text-foreground font-medium"
                >
                  <option value="Sales & BD">Sales & BD</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design & Creative">Design & Creative</option>
                  <option value="Operations">Operations</option>
                  <option value="Management">Management</option>
                  <option value="Customer Success">Customer Success</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground mb-1 block">Designation / Title</Label>
              <Input
                value={inviteTitle}
                onChange={(e) => setInviteTitle(e.target.value)}
                placeholder="e.g. Account Executive"
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsInviteOpen(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 text-xs font-semibold cursor-pointer">
                <Send className="h-3 w-3" />
                <span>Send Portal Invitation</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
