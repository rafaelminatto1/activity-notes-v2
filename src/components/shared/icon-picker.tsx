"use client";

import { useTheme } from "next-themes";
import { Smile, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });
import data from "@emoji-mart/data";

interface IconPickerProps {
  icon?: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ icon, onChange }: IconPickerProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        {icon ? (
          <button className="group relative text-5xl hover:opacity-80 transition-opacity">
            {icon}
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-muted group-hover:flex"
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        ) : (
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Smile className="mr-1 inline h-3.5 w-3.5" />
            Adicionar ícone
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto border-none p-0 shadow-lg" align="start">
        <EmojiPicker
          data={data}
          onEmojiSelect={(emoji: { native: string }) => onChange(emoji.native)}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          locale="pt"
          previewPosition="none"
          skinTonePosition="search"
        />
      </PopoverContent>
    </Popover>
  );
}
