import * as React from "react"
import { db, auth } from "@/lib/firebase"
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

export interface PipelineStageConfig {
  id: string
  label: string
  color: string
}

export interface PipelineTemplateConfig {
  id: string
  name: string
  description: string
  stages: PipelineStageConfig[]
}

export const WORKSPACE_PIPELINE_TEMPLATES: Record<string, PipelineTemplateConfig> = {
  Agency: {
    id: "Agency",
    name: "Agency & Studio",
    description: "Multi-client scoping, design sprints & engineering retainers",
    stages: [
      { id: "In Discovery", label: "Discovery", color: "indigo" },
      { id: "Proposal Sent", label: "Proposal Sent", color: "sky" },
      { id: "Negotiation", label: "Negotiation", color: "amber" },
      { id: "Won", label: "Closed Won", color: "emerald" },
    ],
  },
  Freelancing: {
    id: "Freelancing",
    name: "Freelance HQ",
    description: "Solo designers, developers & fractional consultants",
    stages: [
      { id: "New", label: "Inbound Prospect", color: "slate" },
      { id: "In Discovery", label: "Discovery Call", color: "indigo" },
      { id: "Proposal Sent", label: "Proposal & Scope", color: "sky" },
      { id: "Negotiation", label: "Rate Negotiation", color: "amber" },
      { id: "Won", label: "Project Won", color: "emerald" },
    ],
  },
  Sales: {
    id: "Sales",
    name: "B2B High Velocity",
    description: "Fast-moving qualification, demo sessions & enterprise closing",
    stages: [
      { id: "Contacted", label: "Qualified Lead", color: "slate" },
      { id: "In Discovery", label: "Demo & Solution", color: "indigo" },
      { id: "Proposal Sent", label: "Proposal Sent", color: "sky" },
      { id: "Negotiation", label: "Legal / Negotiation", color: "amber" },
      { id: "Won", label: "Closed Won", color: "emerald" },
    ],
  },
  Full: {
    id: "Full",
    name: "Full Lifecycle",
    description: "Comprehensive 6-stage end-to-end client journey",
    stages: [
      { id: "New", label: "New Lead", color: "slate" },
      { id: "Contacted", label: "Contacted", color: "blue" },
      { id: "In Discovery", label: "In Discovery", color: "indigo" },
      { id: "Proposal Sent", label: "Proposal Sent", color: "sky" },
      { id: "Negotiation", label: "Negotiation", color: "amber" },
      { id: "Won", label: "Closed Won", color: "emerald" },
    ],
  },
}

export interface CountryConfig {
  code: string
  name: string
  callingCode: string
  phoneDigits: number
  flag: string
  phonePlaceholder: string
}

export interface CurrencyConfig {
  code: string
  symbol: string
  name: string
  locale: string
  notation: "indian" | "international"
}

export interface TimezoneConfig {
  id: string
  label: string
}

export interface ValuePreset {
  label: string
  val: number
}

export interface WorkspaceSettings {
  // Account & Org Info
  workspaceName: string
  tagline: string
  accountOwnerName: string
  accountEmail: string
  defaultLocation: string

  // Regional Preferences
  country: CountryConfig
  currency: CurrencyConfig
  timezone: string
  timezoneLabel: string

  // Deal Flow Presets
  industries: string[]
  services: string[]
  cityPresets: string[]
  valuePresets: ValuePreset[]

  // Pipeline Template Preferences
  pipelineTemplate?: string
  customStages?: PipelineStageConfig[]

  // Subscription, Trial & Use Case
  plan?: string
  trialActive?: boolean
  trialStartDate?: string
  trialEndDate?: string
  teamSize?: string
  role?: string
  useCase?: "Freelancing" | "Agency" | "Small Business" | "Sales" | "Other"
  companyLogoUrl?: string
  companyName?: string
}

export const COUNTRY_PRESETS: CountryConfig[] = [
  {
    code: "IN",
    name: "India",
    callingCode: "+91",
    phoneDigits: 10,
    flag: "🇮🇳",
    phonePlaceholder: "+91 98765 43210",
  },
  {
    code: "US",
    name: "United States",
    callingCode: "+1",
    phoneDigits: 10,
    flag: "🇺🇸",
    phonePlaceholder: "+1 (555) 019-2834",
  },
  {
    code: "GB",
    name: "United Kingdom",
    callingCode: "+44",
    phoneDigits: 10,
    flag: "🇬🇧",
    phonePlaceholder: "+44 7911 123456",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    callingCode: "+971",
    phoneDigits: 9,
    flag: "🇦🇪",
    phonePlaceholder: "+971 50 123 4567",
  },
  {
    code: "SG",
    name: "Singapore",
    callingCode: "+65",
    phoneDigits: 8,
    flag: "🇸🇬",
    phonePlaceholder: "+65 9123 4567",
  },
  {
    code: "CA",
    name: "Canada",
    callingCode: "+1",
    phoneDigits: 10,
    flag: "🇨🇦",
    phonePlaceholder: "+1 (416) 555-0199",
  },
  {
    code: "AU",
    name: "Australia",
    callingCode: "+61",
    phoneDigits: 9,
    flag: "🇦🇺",
    phonePlaceholder: "+61 412 345 678",
  },
  {
    code: "DE",
    name: "Germany / EU",
    callingCode: "+49",
    phoneDigits: 10,
    flag: "🇩🇪",
    phonePlaceholder: "+49 151 12345678",
  },
]

export const CURRENCY_PRESETS: CurrencyConfig[] = [
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee (INR)",
    locale: "en-IN",
    notation: "indian",
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar (USD)",
    locale: "en-US",
    notation: "international",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro (EUR)",
    locale: "de-DE",
    notation: "international",
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound (GBP)",
    locale: "en-GB",
    notation: "international",
  },
  {
    code: "AED",
    symbol: "AED",
    name: "UAE Dirham (AED)",
    locale: "en-AE",
    notation: "international",
  },
  {
    code: "SGD",
    symbol: "S$",
    name: "Singapore Dollar (SGD)",
    locale: "en-SG",
    notation: "international",
  },
]

export const TIMEZONE_PRESETS: TimezoneConfig[] = [
  { id: "Asia/Kolkata", label: "IST (UTC+5:30) - India" },
  { id: "America/New_York", label: "EST (UTC-5) - New York" },
  { id: "America/Los_Angeles", label: "PST (UTC-8) - Los Angeles" },
  { id: "America/Chicago", label: "CST (UTC-6) - Chicago" },
  { id: "Europe/London", label: "GMT / BST (UTC+0) - London" },
  { id: "Europe/Berlin", label: "CET (UTC+1) - Berlin / Paris" },
  { id: "Asia/Dubai", label: "GST (UTC+4) - Dubai" },
  { id: "Asia/Singapore", label: "SGT (UTC+8) - Singapore" },
  { id: "UTC", label: "UTC (Coordinated Universal Time)" },
]

export function getDefaultValuePresets(currencyCode: string, symbol: string): ValuePreset[] {
  if (currencyCode === "INR") {
    return [
      { label: "₹1.5L", val: 150000 },
      { label: "₹3.5L", val: 350000 },
      { label: "₹6.5L", val: 650000 },
      { label: "₹12.5L", val: 1250000 },
      { label: "₹18L", val: 1800000 },
      { label: "₹25L", val: 2500000 },
    ]
  }
  return [
    { label: `${symbol}2.5K`, val: 2500 },
    { label: `${symbol}5K`, val: 5000 },
    { label: `${symbol}10K`, val: 10000 },
    { label: `${symbol}20K`, val: 20000 },
    { label: `${symbol}35K`, val: 35000 },
    { label: `${symbol}50K`, val: 50000 },
  ]
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  workspaceName: "Xweet Suite",
  tagline: "Freelance HQ",
  accountOwnerName: "Rajvi S.",
  accountEmail: "rajvi@xweet.io",
  defaultLocation: "Bengaluru, KA",
  country: COUNTRY_PRESETS[0], // India +91, 10 digits
  currency: CURRENCY_PRESETS[0], // INR ₹
  timezone: "Asia/Kolkata",
  timezoneLabel: "IST (UTC+5:30)",
  industries: [
    "SaaS & Tech",
    "Fintech",
    "E-Commerce & D2C",
    "Healthcare & Biotech",
    "EdTech",
    "Design & Creative Studio",
    "Consumer & Media",
    "Other",
  ],
  services: [
    "Design System Architecture",
    "Full-Stack MVP Development",
    "Mobile App (iOS/Android)",
    "Brand Identity & Webflow",
    "SaaS UI/UX Revamp",
    "Monthly Engineering Retainer",
    "AI Integration & Dashboard",
  ],
  cityPresets: ["Bengaluru, KA", "Mumbai, MH", "Gurugram, HR", "Hyderabad, TS", "Pune, MH", "Delhi NCR"],
  valuePresets: getDefaultValuePresets("INR", "₹"),
  plan: "Pro Trial",
  trialActive: true,
  trialStartDate: new Date().toISOString().slice(0, 10),
  trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  teamSize: "1-5",
  role: "Agency Owner",
  useCase: "Agency",
  companyName: "Xweet Agency",
  pipelineTemplate: "Agency",
}

const STORAGE_KEY = "xweet_suite_workspace_settings_v1"

interface WorkspaceContextType {
  settings: WorkspaceSettings
  updateSettings: (newSettings: Partial<WorkspaceSettings>) => Promise<void> | void
  resetSettings: () => Promise<void> | void
  formatCurrency: (value: number) => string
  formatCompactCurrency: (value: number) => string
  formatPhoneNumber: (rawPhone: string) => string
  cleanDigitsOnly: (rawPhone: string) => string
  getWhatsAppUrl: (phone: string, leadName?: string) => string
  isSyncing: boolean
  lastSyncedAt: Date | null
  activePipelineStages: PipelineStageConfig[]
  pipelineTemplates: Record<string, PipelineTemplateConfig>
  setPipelineTemplate: (templateId: string) => void
}

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(null)

  const [settings, setSettings] = React.useState<WorkspaceSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          ...DEFAULT_WORKSPACE_SETTINGS,
          ...parsed,
          country: { ...DEFAULT_WORKSPACE_SETTINGS.country, ...(parsed.country || {}) },
          currency: { ...DEFAULT_WORKSPACE_SETTINGS.currency, ...(parsed.currency || {}) },
        }
      }
    } catch (e) {
      console.warn("Failed to load workspace settings from localStorage", e)
    }
    return DEFAULT_WORKSPACE_SETTINGS
  })

  // Real-time bidirectional sync with Firestore on user auth
  React.useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const workspaceDocRef = doc(db, "workspaces", user.uid)
        unsubscribeFirestore = onSnapshot(
          workspaceDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const remoteData = snapshot.data()
              setSettings((prev) => {
                const merged: WorkspaceSettings = {
                  ...DEFAULT_WORKSPACE_SETTINGS,
                  ...prev,
                  ...remoteData,
                  country: { ...DEFAULT_WORKSPACE_SETTINGS.country, ...(remoteData.country || prev.country) },
                  currency: { ...DEFAULT_WORKSPACE_SETTINGS.currency, ...(remoteData.currency || prev.currency) },
                }
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
                } catch {}
                return merged
              })
              setLastSyncedAt(new Date())
            } else {
              // Initialize empty workspace doc in Firestore
              setDoc(
                workspaceDocRef,
                {
                  ...DEFAULT_WORKSPACE_SETTINGS,
                  userId: user.uid,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              ).catch(console.warn)
            }
          },
          (err) => {
            console.warn("Firestore workspace listener info:", err)
          }
        )
      } else {
        if (unsubscribeFirestore) {
          unsubscribeFirestore()
          unsubscribeFirestore = null
        }
      }
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeFirestore) unsubscribeFirestore()
    }
  }, [])

  // Persist locally and sync to Firestore
  const updateSettings = React.useCallback(async (partial: Partial<WorkspaceSettings>) => {
    let nextSettings: WorkspaceSettings | null = null
    setSettings((prev) => {
      const updated: WorkspaceSettings = {
        ...prev,
        ...partial,
      }
      nextSettings = updated
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error("Failed to save workspace settings to localStorage", e)
      }
      return updated
    })

    const user = auth.currentUser
    if (user && nextSettings) {
      setIsSyncing(true)
      try {
        const workspaceDocRef = doc(db, "workspaces", user.uid)
        const userDocRef = doc(db, "users", user.uid)
        await Promise.all([
          setDoc(
            workspaceDocRef,
            {
              ...(nextSettings as WorkspaceSettings),
              userId: user.uid,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ),
          setDoc(
            userDocRef,
            {
              workspaceName: (nextSettings as WorkspaceSettings).workspaceName,
              companyName: (nextSettings as WorkspaceSettings).companyName,
              companyLogoUrl: (nextSettings as WorkspaceSettings).companyLogoUrl || "",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ),
        ])
        setLastSyncedAt(new Date())
      } catch (e) {
        console.warn("Firestore settings sync error:", e)
      } finally {
        setIsSyncing(false)
      }
    }
  }, [])

  const resetSettings = React.useCallback(async () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    setSettings(DEFAULT_WORKSPACE_SETTINGS)
    const user = auth.currentUser
    if (user) {
      try {
        await setDoc(doc(db, "workspaces", user.uid), {
          ...DEFAULT_WORKSPACE_SETTINGS,
          userId: user.uid,
          updatedAt: serverTimestamp(),
        })
      } catch (e) {
        console.warn("Firestore reset error:", e)
      }
    }
  }, [])

  // Compute active pipeline stages based on selected template
  const activePipelineStages = React.useMemo(() => {
    if (settings.customStages && settings.customStages.length > 0) {
      return settings.customStages
    }
    const templateKey = settings.pipelineTemplate || "Agency"
    const template = WORKSPACE_PIPELINE_TEMPLATES[templateKey] || WORKSPACE_PIPELINE_TEMPLATES.Agency
    return template.stages
  }, [settings.customStages, settings.pipelineTemplate])

  const setPipelineTemplate = React.useCallback(
    (templateId: string) => {
      const template = WORKSPACE_PIPELINE_TEMPLATES[templateId]
      if (template) {
        updateSettings({
          pipelineTemplate: templateId,
          customStages: undefined, // revert to template default stages
        })
      }
    },
    [updateSettings]
  )

  // Dynamic currency formatter based on workspace preference
  const formatCurrency = React.useCallback(
    (value: number): string => {
      if (isNaN(value)) return `${settings.currency.symbol}0`
      try {
        return new Intl.NumberFormat(settings.currency.locale, {
          style: "currency",
          currency: settings.currency.code,
          maximumFractionDigits: 0,
        }).format(value)
      } catch {
        return `${settings.currency.symbol}${value.toLocaleString()}`
      }
    },
    [settings.currency]
  )

  // Dynamic compact currency formatter (Indian Lakhs/Crores vs Intl Millions/Thousands)
  const formatCompactCurrency = React.useCallback(
    (value: number): string => {
      if (isNaN(value) || value === 0) return `${settings.currency.symbol}0`
      const sym = settings.currency.symbol
      const abs = Math.abs(value)

      if (settings.currency.notation === "indian") {
        if (abs >= 10000000) {
          const cr = (value / 10000000).toFixed(1).replace(/\.0$/, "")
          return `${sym}${cr} Cr`
        }
        if (abs >= 100000) {
          const lakh = (value / 100000).toFixed(1).replace(/\.0$/, "")
          return `${sym}${lakh}L`
        }
        if (abs >= 1000) {
          const k = (value / 1000).toFixed(1).replace(/\.0$/, "")
          return `${sym}${k}K`
        }
        return formatCurrency(value)
      } else {
        // International notation: M / K
        if (abs >= 1000000) {
          const m = (value / 1000000).toFixed(1).replace(/\.0$/, "")
          return `${sym}${m}M`
        }
        if (abs >= 1000) {
          const k = (value / 1000).toFixed(1).replace(/\.0$/, "")
          return `${sym}${k}K`
        }
        return formatCurrency(value)
      }
    },
    [settings.currency, formatCurrency]
  )

  // Extract clean digits without calling code
  const cleanDigitsOnly = React.useCallback(
    (rawPhone: string): string => {
      if (!rawPhone) return ""
      let cleaned = rawPhone.replace(/[^\d]/g, "")
      const callingDigits = settings.country.callingCode.replace(/[^\d]/g, "")
      if (cleaned.startsWith(callingDigits)) {
        cleaned = cleaned.slice(callingDigits.length)
      }
      return cleaned.slice(0, settings.country.phoneDigits)
    },
    [settings.country]
  )

  // Formats phone according to active country settings
  const formatPhoneNumber = React.useCallback(
    (rawPhone: string): string => {
      if (!rawPhone) return ""
      const digits = cleanDigitsOnly(rawPhone)
      if (!digits) return `${settings.country.callingCode} `

      // If India (10 digits: 5 + 5)
      if (settings.country.callingCode === "+91") {
        if (digits.length <= 5) {
          return `+91 ${digits}`
        }
        return `+91 ${digits.slice(0, 5)} ${digits.slice(5, 10)}`
      }

      // If US / Canada (+1 3 + 3 + 4)
      if (settings.country.callingCode === "+1") {
        if (digits.length <= 3) {
          return `+1 (${digits}`
        }
        if (digits.length <= 6) {
          return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`
        }
        return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
      }

      // Default international spacing: code + space + chunks
      if (digits.length <= 4) {
        return `${settings.country.callingCode} ${digits}`
      }
      return `${settings.country.callingCode} ${digits.slice(0, 4)} ${digits.slice(4)}`
    },
    [settings.country, cleanDigitsOnly]
  )

  // Generates WhatsApp link normalized with active country calling code
  const getWhatsAppUrl = React.useCallback(
    (phone: string, leadName?: string): string => {
      if (!phone) return ""
      const digits = phone.replace(/[^\d]/g, "")
      const callingDigits = settings.country.callingCode.replace(/[^\d]/g, "")

      let fullNumber = digits
      // If user typed only local digits
      if (!digits.startsWith(callingDigits)) {
        fullNumber = `${callingDigits}${digits}`
      }

      const message = leadName
        ? `Hi ${leadName}, connecting from ${settings.workspaceName} regarding your project.`
        : `Hello, connecting from ${settings.workspaceName}.`

      return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`
    },
    [settings.country, settings.workspaceName]
  )

  return (
    <WorkspaceContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        formatCurrency,
        formatCompactCurrency,
        formatPhoneNumber,
        cleanDigitsOnly,
        getWhatsAppUrl,
        isSyncing,
        lastSyncedAt,
        activePipelineStages,
        pipelineTemplates: WORKSPACE_PIPELINE_TEMPLATES,
        setPipelineTemplate,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext)
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}
