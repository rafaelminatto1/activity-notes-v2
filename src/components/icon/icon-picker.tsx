"use client";

import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIconStore, ICON_CATEGORIES } from "@/stores/icon-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import type { DocumentIcon } from "@/types/icon";

interface IconPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
}

export function IconPicker({ open, onClose, onSelect }: IconPickerProps) {
  const { iconCategories, selectedIcon, recentIcons, setSelectedIcon, addRecentIcon } = useIconStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Filtrar ícones por busca
  const filteredCategories = ICON_CATEGORIES.map((category) => ({
    ...category,
    icons: category.icons.filter((icon) =>
      icon.emoji.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  // Ícones recentes (não duplicados com categorias)
  const uniqueRecentIcons = recentIcons.filter(
    (emoji) => !filteredCategories.some((cat) =>
      cat.icons.some((icon) => icon.emoji === emoji)
    )
  );

  // Todas as categorias expandidas se houver busca
  const categoriesToDisplay = searchQuery
    ? filteredCategories
    : expandedCategory
    ? filteredCategories.map((cat) =>
        cat.id === expandedCategory ? cat : { ...cat, icons: [] }
      )
    : ICON_CATEGORIES;

  const handleIconSelect = useCallback(
    (icon: DocumentIcon) => {
      setSelectedIcon(icon.emoji);
      addRecentIcon(icon.emoji);
      onSelect(icon.emoji);
      onClose();
    },
    [setSelectedIcon, addRecentIcon, onSelect, onClose]
  );

  const handleRemoveIcon = useCallback(() => {
    setSelectedIcon(null);
    onSelect("");
    onClose();
  }, [setSelectedIcon, onSelect, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card text-card-foreground rounded-lg shadow-lg w-full max-w-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Escolher Ícone</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        {searchQuery && (
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar ícone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Recent Icons */}
        {uniqueRecentIcons.length > 0 && (
          <div className="p-4 border-b border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Recentemente usados
            </p>
            <div className="flex gap-2 flex-wrap">
              {uniqueRecentIcons.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    const icon = ICON_CATEGORIES.flatMap((cat) => cat.icons).find(
                      (i) => i.emoji === emoji
                    );
                    if (icon) handleIconSelect(icon);
                  }}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-md border border-border hover:bg-accent transition-colors",
                    selectedIcon === emoji && "ring-2 ring-primary"
                  )}
                >
                  <span className="text-2xl">{emoji}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {categoriesToDisplay.map((category) => (
              <div key={category.id}>
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className="flex items-center justify-between w-full text-left hover:bg-accent rounded-md p-2 transition-colors"
                >
                  <span className="font-medium text-sm">{category.name}</span>
                </button>

                {expandedCategory === category.id && category.icons.length > 0 && (
                  <div className="mt-2 grid grid-cols-8 gap-2">
                    {category.icons.map((icon) => (
                      <button
                        key={icon.id}
                        onClick={() => handleIconSelect(icon)}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent transition-colors",
                          selectedIcon === icon.emoji && "ring-2 ring-primary"
                        )}
                      >
                        <span className="text-xl">{icon.emoji}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer - Clear selection */}
        {selectedIcon && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
            <button
              onClick={handleRemoveIcon}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Remover ícone
            </button>
            <button
              onClick={() => {
                setSelectedIcon(selectedIcon);
                onSelect(selectedIcon);
                onClose();
              }}
              className="text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors rounded-md px-4 py-2"
            >
              Confirmar: <span className="text-xl ml-1">{selectedIcon}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
