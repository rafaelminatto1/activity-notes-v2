"use client";

import { SemanticGraph } from "@/components/graph/semantic-graph";

export default function GraphPage() {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mapa de Conexões</h1>
          <p className="text-muted-foreground mt-2">
            Visualize como suas notas estão conectadas através de similaridade semântica.
          </p>
        </div>
        
        <SemanticGraph />
      </div>
    </div>
  );
}
