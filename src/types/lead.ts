import { z } from "zod"

export type LeadStage =
  | "New"
  | "Contacted"
  | "In Discovery"
  | "Proposal Sent"
  | "Negotiation"
  | "Won"
  | "Lost"

export type LeadPriority = "Urgent" | "High" | "Medium" | "Low"

export type LeadSource =
  | "Twitter/X"
  | "LinkedIn"
  | "Referral"
  | "Inbound Website"
  | "Cold Outreach"
  | "Event / Meetup"

export type LeadIndustry =
  | "SaaS & Tech"
  | "Fintech"
  | "E-Commerce & D2C"
  | "Healthcare & Biotech"
  | "EdTech"
  | "Design & Creative Studio"
  | "Consumer & Media"
  | "Other"

export type ServiceInterest =
  | "Design System Architecture"
  | "Full-Stack MVP Development"
  | "Mobile App (iOS/Android)"
  | "Brand Identity & Webflow"
  | "SaaS UI/UX Revamp"
  | "Monthly Engineering Retainer"
  | "AI Integration & Dashboard"

export const leadFormSchema = z
  .object({
    businessName: z.string().min(2, "Business name is required"),
    contactPerson: z.string().min(2, "Contact person name is required"),
    industry: z.string().min(1, "Please select an industry"),
    location: z.string().min(2, "City / Location is required (e.g. Bengaluru, Mumbai)"),
    website: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || /^https?:\/\/.+/.test(val) || /^[\w-]+\.[\w.-]+/.test(val),
        "Enter a valid URL (e.g. https://acme.in or acme.in)"
      ),
    email: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        "Please enter a valid email address"
      ),
    phone: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (!val || val.trim().length <= 4) return true
          const digits = val.replace(/[^\d]/g, "")
          return digits.length >= 7 && digits.length <= 15
        },
        "Please enter a valid phone number (7-15 digits)"
      ),
    source: z.string().min(1, "Lead source is required"),
    serviceInterest: z.string().min(1, "Service interest is required"),
    estimatedValue: z.number().min(1, "Estimated deal value is required"),
    priority: z.enum(["Urgent", "High", "Medium", "Low"]),
    status: z.enum([
      "New",
      "Contacted",
      "In Discovery",
      "Proposal Sent",
      "Negotiation",
      "Won",
      "Lost",
    ]),
    notes: z.string().optional(),
    nextFollowUpDate: z.string().min(1, "Follow-up date is required"),
    nextFollowUpTime: z.string().min(1, "Follow-up time is required"),
    showOnDashboard: z.boolean().optional(),
    dashboardNote: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasEmail = Boolean(data.email && data.email.trim().length > 0)
      const digits = (data.phone || "").replace(/[^\d]/g, "")
      const hasPhone = digits.length >= 7
      return hasEmail || hasPhone
    },
    {
      message: "Please provide at least one contact channel: Email address or Phone number",
      path: ["email"],
    }
  )

export type LeadFormData = z.infer<typeof leadFormSchema>

export interface LeadItem extends LeadFormData {
  id: string
  createdAt: string
  lastContactIST: string
  isArchived?: boolean
  archivedAt?: string
}

export function hasValidPhone(phone?: string): boolean {
  if (!phone) return false
  const digits = phone.replace(/[^0-9]/g, "")
  return digits.length >= 7
}

export function hasValidEmail(email?: string): boolean {
  return Boolean(email && email.trim().length > 3 && email.includes("@"))
}
