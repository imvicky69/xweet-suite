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

export const leadFormSchema = z.object({
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
  email: z.string().email("Valid email address is required"),
  phone: z
    .string()
    .min(8, "Phone number required (e.g. +91 98765 43210)"),
  source: z.string().min(1, "Lead source is required"),
  serviceInterest: z.string().min(1, "Service interest is required"),
  estimatedValue: z.number().min(1000, "Estimated value must be at least ₹1,000"),
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
  nextFollowUpTime: z.string().min(1, "Follow-up time (IST) is required"),
})

export type LeadFormData = z.infer<typeof leadFormSchema>

export interface LeadItem extends LeadFormData {
  id: string
  createdAt: string
  lastContactIST: string
}
