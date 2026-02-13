import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey) return null;
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

const app = getFirebaseApp();

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;

// Analytics — browser-only, only if measurement ID is configured
export const analytics: Analytics | null =
  typeof window !== "undefined" &&
  app &&
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    ? getAnalytics(app)
    : null;

// Conectar a emuladores em desenvolvimento
if (typeof window !== "undefined" && app) {
  const authHost = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST;
  const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;
  const storageHost = process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST;

  if (authHost && auth) {
    connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
  }
  if (firestoreHost && db) {
    const [host, port] = firestoreHost.split(":");
    connectFirestoreEmulator(db, host, parseInt(port, 10));
  }
  if (storageHost && storage) {
    const [host, port] = storageHost.split(":");
    connectStorageEmulator(storage, host, parseInt(port, 10));
  }
}

export default app;
