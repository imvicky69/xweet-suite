import * as React from "react"
import { Link } from "react-router-dom"
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
import { toast } from "sonner"
import {
  Building2,
  Globe,
  Coins,
  Clock,
  Phone,
  CheckCircle2,
  RotateCcw,
  Save,
  Plus,
  X,
  Sparkles,
  ShieldCheck,
  User,
  MapPin,
  HelpCircle,
  ExternalLink,
} from "lucide-react"
import { AppLogo } from "@/components/ui/app-logo"

export default function Settings() {
  const {
    settings,
    updateSettings,
    resetSettings,
    formatCurrency,
    formatCompactCurrency,
    formatPhoneNumber,
  } = useWorkspace()

  // Local draft state for pristine editing experience
  const [formData, setFormData] = React.useState(settings)
  const [hasChanges, setHasChanges] = React.useState(false)

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
    // Also intelligently suggest default currency and timezone if switching country
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
      description: "Currency, phone format, and deal settings have been updated across your suite.",
    })
  }

  // Reset handler
  const handleReset = () => {
    resetSettings()
    toast.info("Preferences restored to default (India/INR/IST)")
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

  const resetValuePresets = () => {
    setFormData((prev) => ({
      ...prev,
      valuePresets: getDefaultValuePresets(prev.currency.code, prev.currency.symbol),
    }))
    setHasChanges(true)
    toast.info("Pricing presets reset to defaults")
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

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto pb-24">
      {/* Top Header & Save Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Workplace Preferences
            </h1>
            <Badge variant="indigo" size="sm" className="font-medium">
              Account Level
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure default country calling codes, currency, timezones, and deal fields for your logged-in workspace.
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
            <span>You have unsaved changes in your workspace preferences.</span>
          </div>
          <Button size="xs" onClick={handleSave} className="cursor-pointer">
            Save Now
          </Button>
        </div>
      )}

      {/* Grid of Preference Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop): Core Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Regional Phone & Country Preferences (Key User Request) */}
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
                      Sets the default country prefix and max digits enforcement for phone inputs & WhatsApp.
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

              {/* Advanced Country Calling Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Custom Calling Code Prefix
                  </Label>
                  <Input
                    value={formData.country.callingCode}
                    onChange={(e) => {
                      const callingCode = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        country: { ...prev.country, callingCode },
                      }))
                      setHasChanges(true)
                    }}
                    placeholder="+91"
                    className="h-9 text-xs font-mono font-medium"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Auto-prepended to phone fields in Lead Form dialog.
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Max Mobile Digits Limit
                  </Label>
                  <Input
                    type="number"
                    min={6}
                    max={15}
                    value={formData.country.phoneDigits}
                    onChange={(e) => {
                      const phoneDigits = parseInt(e.target.value, 10) || 10
                      setFormData((prev) => ({
                        ...prev,
                        country: { ...prev.country, phoneDigits },
                      }))
                      setHasChanges(true)
                    }}
                    className="h-9 text-xs font-mono font-medium"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Prevents infinite typing & strictly caps numbers (e.g. 10 for India).
                  </p>
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
                      placeholder={`Enter digits (e.g. 9876543210)`}
                      className="h-9 text-xs font-mono bg-card"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-mono text-foreground font-semibold">
                    <span>Formatted:</span>
                    <span className="text-primary">{formatPhoneNumber(testPhoneInput)}</span>
                  </div>
                </div>

                {/* Approximate Deal Value / Pricing Presets */}
                <div className="pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <Label className="text-xs font-semibold text-foreground block">
                        Approximate Deal Value / Pricing Presets ({formData.currency.code})
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        Your company's pricing tiers shown as 1-tap quick presets in the Lead wizard (always overridable).
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={resetValuePresets}
                      className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Reset Defaults
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.valuePresets.map((vp) => (
                      <div
                        key={vp.val}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs shadow-2xs"
                      >
                        <span className="font-mono font-bold text-primary">{vp.label}</span>
                        <span className="text-[10px] text-muted-foreground">({formatCurrency(vp.val)})</span>
                        <button
                          type="button"
                          onClick={() => removeValuePreset(vp.val)}
                          className="hover:text-destructive text-muted-foreground p-0.5 ml-0.5 cursor-pointer"
                          title="Remove tier"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      type="number"
                      placeholder={`Amount (e.g. 50000)`}
                      value={newPresetAmount}
                      onChange={(e) => setNewPresetAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addValuePreset()
                        }
                      }}
                      className="h-8 text-xs bg-card font-mono"
                    />
                    <Input
                      placeholder={`Label (e.g. ${formData.currency.symbol}50K, optional)`}
                      value={newPresetLabel}
                      onChange={(e) => setNewPresetLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addValuePreset()
                        }
                      }}
                      className="h-8 text-xs bg-card"
                    />
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={addValuePreset}
                      className="gap-1 h-8 cursor-pointer font-medium"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Pricing Tier</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Currency & Financial Locale Preferences */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Currency & Revenue System</CardTitle>
                    <CardDescription>
                      Default currency symbol, number notation (Indian Lakhs vs Intl Millions), and deal values.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="indigo" size="sm" className="font-mono font-semibold">
                  {formData.currency.symbol} {formData.currency.code}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-2 block">
                  Select Base Currency
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CURRENCY_PRESETS.map((curr) => {
                    const isSelected = formData.currency.code === curr.code
                    return (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => handleCurrencySelect(curr)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                            : "border-border/80 bg-card hover:bg-secondary/70 hover:border-border"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-foreground">{curr.code}</div>
                          <div className="text-[10px] text-muted-foreground">{curr.name}</div>
                        </div>
                        <span className="text-base font-bold text-primary">{curr.symbol}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Number Notation Style */}
              <div className="pt-2 border-t border-border/50">
                <Label className="text-xs font-semibold text-foreground mb-2 block">
                  Number & Value Notation Style
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        currency: { ...prev.currency, notation: "indian" },
                      }))
                      setHasChanges(true)
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      formData.currency.notation === "indian"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border/80 bg-card hover:bg-secondary/70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">Indian System</span>
                      {formData.currency.notation === "indian" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Lakhs & Crores (e.g. {formData.currency.symbol}1.5L, {formData.currency.symbol}12.5L, {formData.currency.symbol}1.2 Cr)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        currency: { ...prev.currency, notation: "international" },
                      }))
                      setHasChanges(true)
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      formData.currency.notation === "international"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border/80 bg-card hover:bg-secondary/70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">International System</span>
                      {formData.currency.notation === "international" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Thousands & Millions (e.g. {formData.currency.symbol}150K, {formData.currency.symbol}1.25M)
                    </p>
                  </button>
                </div>
              </div>

              {/* Value Formatting Live Preview */}
              <div className="rounded-lg border border-border/80 bg-secondary/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Sample Value Formats:</span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-card px-2 py-0.5 font-mono text-[11px] font-semibold border border-border">
                    {formatCompactCurrency(350000)}
                  </span>
                  <span className="rounded bg-card px-2 py-0.5 font-mono text-[11px] font-semibold border border-border">
                    {formatCompactCurrency(1250000)}
                  </span>
                  <span className="rounded bg-card px-2 py-0.5 font-mono text-[11px] font-semibold border border-border">
                    {formatCurrency(2450000)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Deal & Lead Form Customization (Industries, Services, Cities) */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Deal Flow & Form Presets</CardTitle>
                    <CardDescription>
                      Customize the industry chips, service options, and quick cities shown in the Lead creation wizard.
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-5">
              {/* Industry Domains */}
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Industry Domains
                </Label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {formData.industries.map((ind) => (
                    <Badge
                      key={ind}
                      variant="neutral"
                      size="sm"
                      className="gap-1 pl-2.5 pr-1.5 py-1 text-xs"
                    >
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new industry (e.g. AI & Robotics, Logistics)"
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
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={addIndustry}
                    className="gap-1 px-3 cursor-pointer shrink-0"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>

              {/* Service Deliverables */}
              <div className="pt-3 border-t border-border/50">
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Service Deliverables
                </Label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {formData.services.map((srv) => (
                    <Badge
                      key={srv}
                      variant="indigo"
                      size="sm"
                      className="gap-1 pl-2.5 pr-1.5 py-1 text-xs"
                    >
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Add service (e.g. SEO Audit, React Native App)"
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
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={addService}
                    className="gap-1 px-3 cursor-pointer shrink-0"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>

              {/* City Presets */}
              <div className="pt-3 border-t border-border/50">
                <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Quick City Presets
                </Label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {formData.cityPresets.map((city) => (
                    <Badge
                      key={city}
                      variant="neutral"
                      size="sm"
                      className="gap-1 pl-2.5 pr-1.5 py-1 text-xs"
                    >
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Add city preset (e.g. Chennai, TN, Austin, TX)"
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
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={addCity}
                    className="gap-1 px-3 cursor-pointer shrink-0"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col wide): Account, Timezone & Future Sync */}
        <div className="space-y-6">
          {/* Account Profile Card */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <AppLogo variant="dark" size="sm" />
                <div>
                  <CardTitle className="text-base">Workspace Identity</CardTitle>
                  <CardDescription>Active logged-in organization profile</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="rounded-lg border border-border/80 bg-secondary/30 p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AppLogo variant="dark" size="xs" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">Official App Brand</span>
                    <span className="text-[10px] text-muted-foreground">High-contrast clear logo (/clear.png)</span>
                  </div>
                </div>
                <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                  Vector PNG
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Workspace Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={formData.workspaceName}
                    onChange={(e) => handleChange("workspaceName", e.target.value)}
                    className="h-9 pl-8 text-xs font-medium bg-card"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Account Owner</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={formData.accountOwnerName}
                    onChange={(e) => handleChange("accountOwnerName", e.target.value)}
                    className="h-9 pl-8 text-xs font-medium bg-card"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Email</Label>
                <Input
                  value={formData.accountEmail}
                  onChange={(e) => handleChange("accountEmail", e.target.value)}
                  className="h-9 text-xs font-medium bg-card"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Default City / Base</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={formData.defaultLocation}
                    onChange={(e) => handleChange("defaultLocation", e.target.value)}
                    className="h-9 pl-8 text-xs font-medium bg-card"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Authentication & Session:</span>
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Switch Account / Re-login</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Timezone Preference Card */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Timezone & Schedules</CardTitle>
                    <CardDescription>Controls task follow-up reminders</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Select Active Timezone
                </Label>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {TIMEZONE_PRESETS.map((tz) => {
                    const isSelected = formData.timezone === tz.id
                    return (
                      <button
                        key={tz.id}
                        type="button"
                        onClick={() => handleTimezoneSelect(tz.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-md border text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5 text-primary font-semibold"
                            : "border-transparent hover:bg-secondary/70 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{tz.label}</span>
                        {isSelected && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time Preview */}
              <div className="rounded-lg border border-border/80 bg-secondary/40 p-3 space-y-1">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Live Clock in Zone
                </div>
                <div className="text-xs font-mono font-semibold text-foreground">
                  {currentTimeInZone}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {formData.timezone}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cloud Sync Roadmap Callout */}
          <Card className="border-border/80 bg-gradient-to-br from-card to-secondary/30 shadow-xs">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Account & Org Level Sync Ready</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                These workplace preferences are instantly stored in your browser session. When multi-tenant authentication or database sync is activated, these settings automatically bind to your organization ID.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
                <HelpCircle className="h-3 w-3" />
                <span>Preset configs can be overridden per team member in the future.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
