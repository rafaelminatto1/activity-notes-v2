"use client";

import { useEffect, useState, useRef } from "react";
import { rtdb } from "@/lib/firebase/config";
import { ref, onValue, set, onDisconnect, remove, serverTimestamp } from "firebase/database";
import { useAuth } from "@/hooks/use-auth";
import { generateColor } from "@/lib/utils";

export interface UserPresence {
  uid: string;
  name: string;
  photoURL?: string;
  color: string;
  lastActive: number;
  cursor?: {
    index: number;
    length: number;
  };
}

export function useCollaboration(documentId: string) {
  const { user, userProfile } = useAuth();
  const [collaborators, setCollaborators] = useState<UserPresence[]>([]);
  const presenceRef = useRef<any>(null);

  // Cor única para o usuário nesta sessão
  const userColor = useRef(generateColor(user?.uid || ""));

  useEffect(() => {
    if (!user || !rtdb || !documentId) return;

    // Referência para a presença deste usuário no documento
    const myPresenceRef = ref(rtdb, `presence/${documentId}/${user.uid}`);
    presenceRef.current = myPresenceRef;

    // Dados iniciais
    const initialData = {
      uid: user.uid,
      name: userProfile?.displayName || user.displayName || user.email || "Anônimo",
      photoURL: userProfile?.avatarUrl || user.photoURL,
      color: userColor.current,
      lastActive: serverTimestamp(),
    };

    // Ao conectar, definir dados e configurar desconexão
    set(myPresenceRef, initialData);
    onDisconnect(myPresenceRef).remove();

    // Escutar todos os usuários neste documento
    const allUsersRef = ref(rtdb, `presence/${documentId}`);
    const unsubscribe = onValue(allUsersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setCollaborators([]);
        return;
      }

      const users: UserPresence[] = Object.values(data);
      // Filtrar usuários inativos (ex: > 5 min sem update) se necessário
      // E remover o próprio usuário da lista visual (opcional)
      setCollaborators(users.filter(u => u.uid !== user.uid));
    });

    return () => {
      unsubscribe();
      if (presenceRef.current) {
        remove(presenceRef.current);
      }
    };
  }, [user, documentId, userProfile]);

  const updateCursor = (index: number, length: number) => {
    if (!presenceRef.current) return;
    set(presenceRef.current, {
      uid: user?.uid,
      name: userProfile?.displayName || user?.displayName || user?.email || "Anônimo",
      photoURL: userProfile?.avatarUrl || user?.photoURL,
      color: userColor.current,
      lastActive: serverTimestamp(),
      cursor: { index, length },
    });
  };

  return { collaborators, updateCursor, userColor: userColor.current };
}
