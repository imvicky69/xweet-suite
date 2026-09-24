import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth"
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore"

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyCaBYWUPo96v_Pd5QMvSoxOrvkSui-GjxY",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "in-fyn.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "in-fyn",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "in-fyn.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "832036354347",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:832036354347:web:63ed3bb59d25622fa16d6e",
}

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: "select_account",
})

export interface WorkspaceFirestoreData {
  uid?: string
  workspaceName: string
  companyName: string
  accountOwnerName: string
  displayName?: string
  fullName?: string
  email: string
  role: string
  teamSize: string
  plan: string
  planId?: string
  trialActive: boolean
  trialStartDate: string
  trialEndDate: string
  useCase: "Freelancing" | "Agency" | "Small Business" | "Sales" | "Other"
  pipelineStages: string[]
  companyLogoUrl?: string
  capabilities?: Record<string, unknown> | unknown
  createdAt?: unknown
  updatedAt?: unknown
}

// Default pipeline presets based on selected use case
export const USE_CASE_PIPELINES: Record<
  "Freelancing" | "Agency" | "Small Business" | "Sales" | "Other",
  { label: string; stages: string[]; description: string }
> = {
  Freelancing: {
    label: "Freelancing & Independent Studio",
    description: "Ideal for solo designers, developers & fractional executives.",
    stages: ["Inbound Lead", "In Discovery", "Proposal Sent", "Negotiation", "Won", "Lost"],
  },
  Agency: {
    label: "Creative / Tech Agency",
    description: "Built for multi-client scoping, design sprints & engineering retainers.",
    stages: ["Prospecting", "Pitch Meeting", "Scoping & SOW", "Retainer Agreed", "Won", "Lost"],
  },
  "Small Business": {
    label: "Small Business & Services",
    description: "Streamlined customer inquiries, quote approvals & closed deals.",
    stages: ["New Inquiry", "Contacted", "Demo / Quote", "Follow-up", "Won", "Lost"],
  },
  Sales: {
    label: "B2B Sales Pipeline",
    description: "High-volume SDR qualification, enterprise demo & contract execution.",
    stages: ["Cold Outreach", "Qualified", "Demo Scheduled", "Contract Sent", "Closed Won", "Closed Lost"],
  },
  Other: {
    label: "General Pipeline",
    description: "Flexible deal progression stages adaptable to any workflow.",
    stages: ["New", "Contacted", "In Discovery", "Proposal Sent", "Negotiation", "Won", "Lost"],
  },
}

// Helper: Save user profile directly to users collection
export async function saveUserToFirestore(
  userId: string,
  userData: Partial<WorkspaceFirestoreData>
) {
  try {
    const userDocRef = doc(db, "users", userId)
    const payload = {
      uid: userId,
      ...userData,
      updatedAt: serverTimestamp(),
    }
    await setDoc(userDocRef, { ...payload, createdAt: serverTimestamp() }, { merge: true })
    return { success: true }
  } catch (error) {
    console.warn("Firestore saveUser write fallback:", error)
    return { success: false, error }
  }
}

// Helper: Save workspace & full user details to Firestore
export async function saveWorkspaceToFirestore(
  userId: string,
  data: WorkspaceFirestoreData
) {
  try {
    const userDocRef = doc(db, "users", userId)
    const workspaceDocRef = doc(db, "workspaces", userId)

    const userPayload = {
      uid: userId,
      fullName: data.accountOwnerName || data.fullName || "",
      displayName: data.accountOwnerName || data.displayName || "",
      email: data.email,
      companyName: data.companyName,
      companyLogoUrl: data.companyLogoUrl || "",
      role: data.role,
      teamSize: data.teamSize,
      plan: data.plan,
      planId: data.planId || "pro",
      trialActive: data.trialActive ?? true,
      trialStartDate: data.trialStartDate || "",
      trialEndDate: data.trialEndDate || "",
      useCase: data.useCase,
      workspaceName: data.workspaceName,
      pipelineStages: data.pipelineStages || [],
      capabilities: data.capabilities || {},
      updatedAt: serverTimestamp(),
    }

    const workspacePayload = {
      ...data,
      userId,
      updatedAt: serverTimestamp(),
    }

    await setDoc(userDocRef, { ...userPayload, createdAt: serverTimestamp() }, { merge: true })
    await setDoc(workspaceDocRef, { ...workspacePayload, createdAt: serverTimestamp() }, { merge: true })
    return { success: true }
  } catch (error) {
    console.warn("Firestore write skipped or failed (offline/sandbox fallback):", error)
    return { success: false, error }
  }
}

// Helper: Fetch existing workspace from Firestore
export async function getWorkspaceFromFirestore(userId: string) {
  try {
    const docRef = doc(db, "workspaces", userId)
    const snapshot = await getDoc(docRef)
    if (snapshot.exists()) {
      return snapshot.data() as WorkspaceFirestoreData
    }
    return null
  } catch (error) {
    console.warn("Firestore read fallback:", error)
    return null
  }
}
