import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

function getAuthInstance() {
  if (!auth) throw new Error("Firebase Auth não inicializado. Verifique suas chaves de API.");
  return auth;
}

function setSessionCookie(token: string) {
  document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax`;
}

function clearSessionCookie() {
  document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

function translateAuthError(code: string): string {
  const errors: Record<string, string> = {
    "auth/email-already-in-use": "Este e-mail já está em uso.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/operation-not-allowed": "Operação não permitida.",
    "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
    "auth/user-disabled": "Esta conta foi desativada.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "Credenciais inválidas.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
    "auth/popup-closed-by-user": "Login cancelado.",
    "auth/popup-blocked": "Pop-up bloqueado pelo navegador. Permita pop-ups e tente novamente.",
    "auth/network-request-failed": "Erro de conexão. Verifique sua internet.",
    "auth/requires-recent-login": "Por segurança, faça login novamente antes de continuar.",
  };
  return errors[code] || "Ocorreu um erro inesperado. Tente novamente.";
}

async function handleAuthAction<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error: unknown) {
    const code = (error as { code?: string }).code || "";
    throw new Error(translateAuthError(code));
  }
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
  return handleAuthAction(async () => {
    const result = await createUserWithEmailAndPassword(getAuthInstance(), email, password);
    await updateProfile(result.user, { displayName });
    const token = await result.user.getIdToken();
    setSessionCookie(token);
    return result.user;
  });
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  return handleAuthAction(async () => {
    const result = await signInWithEmailAndPassword(getAuthInstance(), email, password);
    const token = await result.user.getIdToken();
    setSessionCookie(token);
    return result.user;
  });
}

export async function signInWithGoogle(): Promise<User> {
  return handleAuthAction(async () => {
    const result = await signInWithPopup(getAuthInstance(), googleProvider);
    const token = await result.user.getIdToken();
    setSessionCookie(token);
    return result.user;
  });
}

export async function signOut(): Promise<void> {
  clearSessionCookie();
  await firebaseSignOut(getAuthInstance());
}

export async function resetPassword(email: string): Promise<void> {
  return handleAuthAction(async () => {
    await sendPasswordResetEmail(getAuthInstance(), email);
  });
}

export async function updateUserAuthProfile(
  displayName?: string,
  photoURL?: string
): Promise<void> {
  const user = getAuthInstance().currentUser;
  if (!user) throw new Error("Nenhum usuário autenticado.");
  return handleAuthAction(async () => {
    const updates: { displayName?: string; photoURL?: string } = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (photoURL !== undefined) updates.photoURL = photoURL;
    await updateProfile(user, updates);
  });
}

export function getCurrentUser(): User | null {
  if (!auth) return null;
  return auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      setSessionCookie(token);
    } else {
      clearSessionCookie();
    }
    callback(user);
  });
}

export function isEmailProvider(): boolean {
  const user = auth?.currentUser;
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === "password");
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = getAuthInstance().currentUser;
  if (!user || !user.email) throw new Error("Nenhum usuário autenticado.");
  return handleAuthAction(async () => {
    const credential = EmailAuthProvider.credential(user.email!, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  });
}

export async function deleteUserAccount(): Promise<void> {
  const user = getAuthInstance().currentUser;
  if (!user) throw new Error("Nenhum usuário autenticado.");
  clearSessionCookie();
  return handleAuthAction(async () => {
    await deleteUser(user);
  });
}
