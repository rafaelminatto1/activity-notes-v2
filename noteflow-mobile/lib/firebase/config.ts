import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Debug: Verificar se as variáveis de ambiente estão carregadas
if (!firebaseConfig.apiKey) {
  console.error('Firebase Config: EXPO_PUBLIC_FIREBASE_API_KEY is missing!');
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function getFirebaseAuth(): Auth {
  try {
    if (Platform.OS === 'web') {
      return initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    } else {
      return initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    }
  } catch (err) {
    console.warn('Firebase Auth: Falha ao inicializar com persistência, tentando fallback...', err);
    return getAuth(app);
  }
}

const auth = getFirebaseAuth();

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

const storage = getStorage(app);

export { app, auth, db, storage };
