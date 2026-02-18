import {
  collection,
  doc,
  addDoc,
  updateDoc,
  // deleteDoc,
  // getDocs,
  query,
  where,
  serverTimestamp,
  // getFirestore,
  onSnapshot,
  // arrayUnion,
  // arrayRemove,
  runTransaction,
} from "firebase/firestore";
import { db } from "./config";
import type { Collaborator } from "@/stores/collaboration-store";

// const db = getFirestore();

function getDb() {
  if (!db) throw new Error("Firestore não inicializado.");
  return db;
}

// Interfaces
export interface Invitation {
  documentId: string;
  email: string;
  role: "editor" | "viewer";
  invitedBy: string;
  status: "pending" | "accepted";
  createdAt: unknown;
}

// Function to invite user by email
export async function inviteUserToDocument(
  documentId: string,
  email: string,
  role: "editor" | "viewer",
  invitedBy: string
) {
  // Check if already invited or collaborator
  // For MVP, just add to a 'invitations' collection or update document 'collaborators' list directly if we assume trusted environment
  // A robust system would send an email. Here we'll simulate by adding to a subcollection 'invitations'

  const invitationsRef = collection(getDb(), "documents", documentId, "invitations");
  await addDoc(invitationsRef, {
    email,
    role,
    invitedBy,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

// Subscribe to collaborators (active users on the doc)
// This is tricky with Firestore. Usually we use Realtime Database for presence.
// For Firestore, we can use a subcollection 'presence' where users update their timestamp.
export function subscribeToCollaborators(
  documentId: string,
  callback: (collaborators: Collaborator[]) => void
) {
  const presenceRef = collection(getDb(), "documents", documentId, "presence");
  const q = query(presenceRef, where("lastActive", ">", new Date(Date.now() - 5 * 60 * 1000))); // Active in last 5 mins

  return onSnapshot(q, (snapshot) => {
    const collaborators = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      isOnline: true // simplified
    })) as Collaborator[];
    callback(collaborators);
  }, (error) => {
    console.error("Error subscribing to collaborators:", error);
  });
}

// Update my presence
export async function updatePresence(documentId: string, userId: string, userData: Partial<Collaborator>) {
  const presenceDoc = doc(getDb(), "documents", documentId, "presence", userId);
  await updateDoc(presenceDoc, {
    ...userData,
    lastActive: serverTimestamp(),
  }).catch(async () => {
    // If doesn't exist, set it
    await runTransaction(getDb(), async (t) => {
      t.set(presenceDoc, {
        ...userData,
        lastActive: serverTimestamp(),
      });
    });
  });
}
