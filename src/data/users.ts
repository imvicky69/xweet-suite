import type {
  WorkspaceUser,
  InviteMemberFormData,
  UserRole,
} from "@/types/user"
import { getDefaultPermissions } from "@/types/user"

export const WORKSPACE_USERS_STORAGE_KEY = "xweet_workspace_users"

/**
 * Creates the primary Admin / Owner user from the signed-up workspace credentials
 */
export function createAdminUser(params: {
  id?: string
  email: string
  fullName: string
  title?: string
  department?: "Management" | "Sales & BD" | "Engineering" | "Design & Creative"
  phone?: string
}): WorkspaceUser {
  return {
    id: params.id || `admin-${Date.now()}`,
    email: params.email.trim(),
    fullName: params.fullName.trim(),
    displayName: params.fullName.trim().split(" ")[0],
    role: "admin",
    status: "active",
    title: params.title || "Founder & Workspace Owner",
    department: params.department || "Management",
    phone: params.phone || "",
    createdAt: new Date().toISOString().slice(0, 10),
    lastActiveAt: "Just now",
    permissions: getDefaultPermissions("admin"),
  }
}

/**
 * Loads all workspace users (Admin + Co-workers) from localStorage
 */
export function getWorkspaceUsers(fallbackAdmin?: {
  name: string
  email: string
}): WorkspaceUser[] {
  try {
    const raw = localStorage.getItem(WORKSPACE_USERS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn("Could not load workspace users from storage:", e)
  }

  // If empty and fallback admin provided, initialize with the signed-up admin
  if (fallbackAdmin && fallbackAdmin.email) {
    const admin = createAdminUser({
      email: fallbackAdmin.email,
      fullName: fallbackAdmin.name || "Workspace Admin",
    })
    saveWorkspaceUsers([admin])
    return [admin]
  }

  return []
}

/**
 * Persists the users list to localStorage
 */
export function saveWorkspaceUsers(users: WorkspaceUser[]): void {
  try {
    localStorage.setItem(WORKSPACE_USERS_STORAGE_KEY, JSON.stringify(users))
    // Dispatch storage event for reactive updates across components
    window.dispatchEvent(new Event("storage"))
  } catch (e) {
    console.warn("Could not persist workspace users:", e)
  }
}

/**
 * Admin adds a new co-worker to the workspace portal
 */
export function addCoworker(
  formData: InviteMemberFormData,
  addedByAdminName: string
): WorkspaceUser {
  const currentUsers = getWorkspaceUsers()
  const now = new Date()

  const newCoworker: WorkspaceUser = {
    id: `member-${Date.now()}`,
    email: formData.email.trim().toLowerCase(),
    fullName: formData.fullName.trim(),
    displayName: formData.fullName.trim().split(" ")[0],
    role: formData.role as UserRole,
    status: "invited", // Newly added co-workers start in 'invited' state
    title: formData.title.trim(),
    department: formData.department,
    phone: formData.phone?.trim() || "",
    invitedBy: addedByAdminName,
    createdAt: now.toISOString().slice(0, 10),
    lastActiveAt: "Invitation Sent",
    permissions: getDefaultPermissions(formData.role as UserRole),
  }

  const updatedUsers = [...currentUsers, newCoworker]
  saveWorkspaceUsers(updatedUsers)
  return newCoworker
}

/**
 * Admin updates a co-worker's role, status, or details
 */
export function updateWorkspaceUser(
  id: string,
  updates: Partial<WorkspaceUser>
): WorkspaceUser | null {
  const currentUsers = getWorkspaceUsers()
  let targetUser: WorkspaceUser | null = null

  const updatedUsers = currentUsers.map((u) => {
    if (u.id === id) {
      const newRole = updates.role || u.role
      targetUser = {
        ...u,
        ...updates,
        permissions: updates.role ? getDefaultPermissions(newRole) : u.permissions,
      }
      return targetUser
    }
    return u
  })

  if (targetUser) {
    saveWorkspaceUsers(updatedUsers)
  }
  return targetUser
}

/**
 * Admin removes a co-worker from the workspace portal
 */
export function removeWorkspaceUser(id: string): boolean {
  const currentUsers = getWorkspaceUsers()
  const target = currentUsers.find((u) => u.id === id)

  // Prevent deleting the primary workspace admin
  if (target?.role === "admin") {
    return false
  }

  const filtered = currentUsers.filter((u) => u.id !== id)
  saveWorkspaceUsers(filtered)
  return true
}

/**
 * Re-sends portal invitation email/link to a co-worker
 */
export function resendPortalInvite(id: string): boolean {
  const currentUsers = getWorkspaceUsers()
  const target = currentUsers.find((u) => u.id === id)
  if (!target) return false

  return true
}
