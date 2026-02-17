"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff, CloudOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function OfflineIndicator() {
  const { isOnline, isSyncing } = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-500 text-white px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium sticky top-0 z-[100] w-full shadow-md"
        >
          <WifiOff className="h-3.5 w-3.5" />
          <span>Você está offline. Alterações serão salvas localmente e sincronizadas quando voltar.</span>
        </motion.div>
      )}
      
      {isOnline && isSyncing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 bg-background border border-primary/20 shadow-lg rounded-full px-3 py-1.5 flex items-center gap-2 text-[10px] font-bold text-primary z-50 uppercase tracking-widest"
        >
          <RefreshCw className="h-3 w-3 animate-spin" />
          Sincronizando dados...
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SyncStatusIcon() {
  const { isOnline, isSyncing } = useOnlineStatus();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-amber-500" title="Offline - Salvo localmente">
        <CloudOff className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-tighter">Offline</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-blue-500" title="Sincronizando com a nuvem">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-tighter">Sincronizando</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-emerald-500" title="Todos os dados sincronizados">
      <CheckCircle2 className="h-4 w-4" />
      <span className="text-[10px] font-bold uppercase tracking-tighter">Sincronizado</span>
    </div>
  );
}
