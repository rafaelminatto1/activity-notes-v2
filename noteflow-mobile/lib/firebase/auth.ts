import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export async function signUp(email: string, password: string, displayName: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  const user = credential.user;

  await updateProfile(user, { displayName });

  await setDoc(doc(db, 'users', user.uid), {
    displayName,
    email: normalizedEmail,
    avatarUrl: '',
    settings: {
      theme: 'system',
      fontSize: 16,
      aiEnabled: true,
      aiLanguage: 'pt-BR',
    },
    favoriteIds: [],
    recentDocIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  await sendPasswordResetEmail(auth, normalizedEmail);
}
