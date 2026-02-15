import { useState } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { useTheme } from "next-themes";

interface IconPickerProps {
    icon: string | null;
    onChange: (icon: string) => void;
    children?: React.ReactNode;
    asChild?: boolean;
}

export function IconPicker({ icon, onChange, children, asChild }: IconPickerProps) {
    const { theme } = useTheme();
    const currentTheme = theme === "system" ? "light" : theme;

    return (
        <Popover>
            <PopoverTrigger asChild={asChild}>
                {children || (
                    <Button variant="outline" size="icon">
                        {icon ? (
                            <span className="text-lg">{icon}</span>
                        ) : (
                            <Smile className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="p-0 border-none w-full shadow-none bg-transparent">
                <Picker
                    data={data}
                    onEmojiSelect={(emoji: any) => onChange(emoji.native)}
                    theme={currentTheme}
                    previewPosition="none"
                    skinTonePosition="none"
                />
            </PopoverContent>
        </Popover>
    );
}
