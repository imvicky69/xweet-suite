import { z } from "zod"

export type UserRole = "admin" | "manager" | "member" | "viewer"

export type UserStatus = "active" | "invited" | "suspended"

export type UserDepartment =
  | "Management"
  | "Sales & BD"
  | "Engineering"
  | "Design & Creative"
  | "Operations"
  | "Customer Success"

export interface UserPermissions {
  canManagePortal: boolean
  canAddMembers: boolean
  canRemoveMembers: boolean
  canManageRoles: boolean
  canManageBilling: boolean
  canExportData: boolean
  canDeleteLeads: boolean
  canAssignLeads: boolean
  canViewFinancialReports: boolean
}

export const ROLE_PERMISSIONS_MAP: Record<UserRole, UserPermissions> = {
  admin: {
    canManagePortal: true,
    canAddMembers: true,
    canRemoveMembers: true,
    canManageRoles: true,
    canManageBilling: true,
    canExportData: true,
    canDeleteLeads: true,
    canAssignLeads: true,
    canViewFinancialReports: true,
  },
  manager: {
    canManagePortal: false,
    canAddMembers: true,
    canRemoveMembers: false,
    canManageRoles: false,
    canManageBilling: false,
    canExportData: true,
    canDeleteLeads: true,
    canAssignLeads: true,
    canViewFinancialReports: true,
  },
  member: {
    canManagePortal: false,
    canAddMembers: false,
    canRemoveMembers: false,
    canManageRoles: false,
    canManageBilling: false,
    canExportData: false,
    canDeleteLeads: false,
    canAssignLeads: false,
    canViewFinancialReports: false,
  },
  viewer: {
    canManagePortal: false,
    canAddMembers: false,
    canRemoveMembers: false,
    canManageRoles: false,
    canManageBilling: false,
    canExportData: false,
    canDeleteLeads: false,
    canAssignLeads: false,
    canViewFinancialReports: false,
  },
}

export interface WorkspaceUser {
  id: string
  workspaceId?: string
  email: string
  fullName: string
  displayName?: string
  role: UserRole
  status: UserStatus
  avatarUrl?: string
  title: string
  department: UserDepartment
  phone?: string
  invitedBy?: string
  createdAt: string
  lastActiveAt?: string
  permissions: UserPermissions
}

export const inviteMemberSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Please enter a valid work email address"),
  role: z.enum(["admin", "manager", "member", "viewer"]),
  title: z.string().min(2, "Job title or designation is required"),
  department: z.enum([
    "Management",
    "Sales & BD",
    "Engineering",
    "Design & Creative",
    "Operations",
    "Customer Success",
  ]),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val || val.length === 0) return true
      const digits = val.replace(/[^\d]/g, "")
      return digits.length >= 7 && digits.length <= 15
    }, "Please enter a valid phone number (7-15 digits)"),
})

export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>

export function getDefaultPermissions(role: UserRole): UserPermissions {
  return { ...ROLE_PERMISSIONS_MAP[role] }
}

export function isWorkspaceAdmin(user?: WorkspaceUser | null): boolean {
  return Boolean(user && user.role === "admin")
}

export function canManageCoworkers(user?: WorkspaceUser | null): boolean {
  return Boolean(user && (user.role === "admin" || user.permissions.canAddMembers))
}

export function getRoleBadgeVariant(
  role: UserRole
): "default" | "indigo" | "neutral" | "success" | "warning" {
  switch (role) {
    case "admin":
      return "default"
    case "manager":
      return "indigo"
    case "member":
      return "neutral"
    case "viewer":
      return "warning"
    default:
      return "neutral"
  }
}

export function getStatusBadgeVariant(
  status: UserStatus
): "default" | "success" | "warning" | "destructive" | "neutral" {
  switch (status) {
    case "active":
      return "success"
    case "invited":
      return "warning"
    case "suspended":
      return "destructive"
    default:
      return "neutral"
  }
}
