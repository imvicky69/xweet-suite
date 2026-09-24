import plansRaw from "@/data/plans.json"

export interface PlanCapability {
  teamMembers: number
  maxLeads: number
  customPipelines: boolean
  whatsAppDirect: boolean
  leadArchiveVault: boolean
  smartFollowUpAlarms: boolean
  exportCSV: boolean
  prioritySupport: boolean
}

export interface PlanDefinition {
  id: "free" | "starter" | "pro"
  name: string
  displayName: string
  tagline: string
  badge: string
  priceINR: number
  priceFormatted: string
  trialPriceFormatted?: string
  period: string
  isPopular: boolean
  hasTrial: boolean
  trialDays: number
  maxMembers: number
  memberLimitText: string
  leadLimit: number
  leadLimitText: string
  pipelineLimit: number
  pipelineLimitText: string
  features: string[]
  limitations: string[]
  capabilities: PlanCapability
}

export interface PlansDatabase {
  version: string
  currency: string
  currencySymbol: string
  plans: PlanDefinition[]
}

export const PLANS_DB = plansRaw as unknown as PlansDatabase
export const PLANS: PlanDefinition[] = PLANS_DB.plans

export function getPlanById(id: string): PlanDefinition {
  return PLANS.find((p) => p.id === id) || PLANS[2] // default to pro
}
