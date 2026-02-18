import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  connectFirestoreEmulator,
  enableMultiTabIndexedDbPersistence,
  type Firestore,
  type FirestoreSettings,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getDatabase, type Database } from "firebase/database";
import { getRemoteConfig, type RemoteConfig } from "firebase/remote-config";
import { getMessaging, type Messaging } from "firebase/messaging";
import { getFunctions, connectFunctionsEmulator, type Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey) return null;
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

const firestoreSettings: FirestoreSettings = {
  ignoreUndefinedProperties: true,
};
if (process.env.NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING === "true") {
  firestoreSettings.experimentalForceLongPolling = true;
}

const app = getFirebaseApp();

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? initializeFirestore(app, firestoreSettings) : null;

// Enable Offline Persistence
if (typeof window !== "undefined" && db) {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === "unimplemented") {
      console.warn("The current browser doesn't support all of the features required to enable persistence");
    }
  });
}

export const storage: FirebaseStorage | null = app ? getStorage(app) : null;
export const rtdb: Database | null = app ? getDatabase(app) : null;
export const remoteConfig: RemoteConfig | null = app && typeof window !== 'undefined' ? getRemoteConfig(app) : null;
export const messaging: Messaging | null = app && typeof window !== 'undefined' ? getMessaging(app) : null;
export const functions: Functions | null = app ? getFunctions(app, "southamerica-east1") : null;

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
  const functionsHost = process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST;

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
  if (functionsHost && functions) {
    const [host, port] = functionsHost.split(":");
    connectFunctionsEmulator(functions, host, parseInt(port, 10));
  }
}

export default app;
