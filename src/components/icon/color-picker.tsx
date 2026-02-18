"use client";

import { useState, useCallback } from "react";
import { X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIconStore, COLOR_PALETTE } from "@/stores/icon-store";

interface ColorPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (color: string) => void;
  currentColor?: string;
}

export function ColorPicker({ open, onClose, onSelect }: ColorPickerProps) {
  const { selectedColor, recentColors, setSelectedColor, addRecentColor } = useIconStore();
  const [searchQuery, setSearchQuery] = useState("");

  // Cores recentes (não duplicadas com paleta)
  const uniqueRecentColors = recentColors.filter(
    (hex) => !COLOR_PALETTE.some((c) => c.hex === hex)
  );

  // Filtrar cores por busca
  const filteredColors = COLOR_PALETTE.filter((color) =>
    color.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleColorSelect = useCallback(
    (color: typeof COLOR_PALETTE[number]) => {
      setSelectedColor(color.hex);
      addRecentColor(color.hex);
      onSelect(color.hex);
      onClose();
    },
    [setSelectedColor, addRecentColor, onSelect, onClose]
  );

  const handleRemoveColor = useCallback(() => {
    setSelectedColor(null);
    onSelect("");
    onClose();
  }, [setSelectedColor, onSelect, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card text-card-foreground rounded-lg shadow-lg w-full max-w-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Escolher Cor</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Recent Colors */}
        {uniqueRecentColors.length > 0 && (
          <div className="p-4 border-b border-border">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Recentemente usadas
            </p>
            <div className="flex gap-2 flex-wrap">
              {uniqueRecentColors.map((hex) => (
                <button
                  key={hex}
                  onClick={() => {
                    setSelectedColor(hex);
                    addRecentColor(hex);
                    onSelect(hex);
                    onClose();
                  }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-md border-2 hover:border-accent transition-all",
                    selectedColor === hex && "ring-2 ring-offset-2 ring-primary"
                  )}
                  style={{ backgroundColor: hex }}
                  title={hex}
                >
                  {selectedColor === hex && (
                    <XCircle className="h-4 w-4 absolute -top-1 -right-1 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Palette */}
        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
          {filteredColors.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">
              Nenhuma cor encontrada para &quot;{searchQuery}&quot;
            </p>
          ) : (
            <div className="grid grid-cols-6 gap-2">
              {filteredColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    "h-10 w-10 items-center justify-center rounded-md border border-border hover:bg-accent hover:border-primary transition-all",
                    selectedColor === color.hex && "ring-2 ring-primary"
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {selectedColor === color.hex && (
                    <div className="flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Clear selection */}
        {selectedColor && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
            <button
              onClick={handleRemoveColor}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Remover cor
            </button>
            <button
              onClick={() => {
                setSelectedColor(selectedColor);
                onSelect(selectedColor);
                onClose();
              }}
              className="text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors rounded-md px-4 py-2"
            >
              Confirmar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
