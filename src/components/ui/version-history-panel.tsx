"use client";

import React from "react";
import { useVersionHistoryStore } from "@/stores/version-history-store";
import { Clock, RotateCcw, X, Eye } from "lucide-react";

export function VersionHistoryPanel() {
  const { isOpen, versions, restoreVersion, closePanel } = useVersionHistoryStore();

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-popover shadow-xl border-l flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Histórico de Versões</h2>
        <button onClick={closePanel} className="p-1 hover:bg-muted rounded-md">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock size={24} className="mx-auto mb-2" />
            <p>Nenhuma versão salva ainda.</p>
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-2">
              {versions.length} versões disponíveis
            </div>

            {versions.slice().reverse().map((versionItem) => (
              <div
                key={versionItem.version}
                onClick={() => restoreVersion(versionItem.version)}
                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border"
              >
                <div className="flex-shrink-0 w-8">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {versionItem.version}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{new Date(versionItem.createdAt).toLocaleString("pt-BR")}</span>
                  </div>

                  <div className="prose prose prose-sm max-h-32 overflow-y-auto text-foreground">
                    {typeof versionItem.content === "object" ? (
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(versionItem.content, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm">
                        {versionItem.plainText}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreVersion(versionItem.version);
                      }}
                      className="p-2 bg-primary text-primary-foreground text-xs rounded-md hover:bg-primary/90"
                      title="Restaurar esta versão"
                    >
                      <RotateCcw size={12} />
                      Restaurar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Preview version
                      }}
                      className="p-2 bg-muted text-muted-foreground text-xs rounded-md hover:bg-muted"
                      title="Visualizar versão"
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        <div className="p-4 border-t mt-2">
          <button
            onClick={closePanel}
            className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
