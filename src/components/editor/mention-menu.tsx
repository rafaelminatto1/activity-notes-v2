"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import { Portal } from "@radix-ui/react-portal";
import { FileText, Loader2 } from "lucide-react";

interface MentionItem {
  id: string;
  label: string;
}

interface MentionMenuProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
  isOpen: boolean;
  clientRect: (() => DOMRect) | null;
}

export function MentionMenu({ items, command, isOpen, clientRect }: MentionMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || !items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        command(items[selectedIndex]);
      } else if (e.key === "Escape") {
        // Let editor handle escape
      }
    },
    [isOpen, items, selectedIndex, command]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !clientRect) return null;

  const rect = clientRect();

  return (
    <Portal>
      <div
        ref={menuRef}
        className="fixed z-50 w-72 bg-popover border rounded-md shadow-lg max-h-72 overflow-y-auto"
        style={{
          top: `${rect.bottom + 5}px`,
          left: `${rect.left}px`,
        }}
      >
        {items.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma nota encontrada
          </div>
        ) : (
          <div className="p-1">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => command(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <FileText size={16} className="text-muted-foreground flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Portal>
  );
}
