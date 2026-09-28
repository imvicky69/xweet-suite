import { db } from "@/lib/firebase"
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore"
import type { LeadItem } from "@/types/lead"

export const getLeadsCollectionRef = (workspaceId: string) => collection(db, "workspaces", workspaceId, "leads")

export const subscribeToLeads = (workspaceId: string, callback: (leads: LeadItem[]) => void) => {
  const q = query(getLeadsCollectionRef(workspaceId), orderBy("createdAt", "desc"))
  return onSnapshot(q, (snapshot) => {
    const leads: LeadItem[] = []
    snapshot.forEach((doc) => {
      leads.push({ id: doc.id, ...doc.data() } as LeadItem)
    })
    callback(leads)
  })
}

export const saveLead = async (workspaceId: string, lead: LeadItem) => {
  if (!lead.id) lead.id = `lead-${Date.now()}`
  const docRef = doc(getLeadsCollectionRef(workspaceId), lead.id)
  await setDoc(docRef, { ...lead, updatedAt: serverTimestamp() }, { merge: true })
}

export const deleteLead = async (workspaceId: string, leadId: string) => {
  const docRef = doc(getLeadsCollectionRef(workspaceId), leadId)
  await deleteDoc(docRef)
}
