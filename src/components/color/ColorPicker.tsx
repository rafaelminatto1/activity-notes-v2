import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const COLORS = [
    { label: "Padrão", value: "" },
    { label: "Cinza", value: "#A1A1AA" },
    { label: "Vermelho", value: "#EF4444" },
    { label: "Laranja", value: "#F97316" },
    { label: "Amarelo", value: "#EAB308" },
    { label: "Verde", value: "#22C55E" },
    { label: "Azul", value: "#3B82F6" },
    { label: "Roxo", value: "#A855F7" },
    { label: "Rosa", value: "#EC4899" },
];

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    return (
        <div className="flex flex-wrap gap-2 p-2 max-w-[200px]">
            {COLORS.map((color) => (
                <button
                    key={color.value || "default"}
                    onClick={() => onChange(color.value)}
                    className={cn(
                        "h-6 w-6 rounded-full border border-muted-foreground/20 hover:scale-110 transition-transform flex items-center justify-center",
                        !color.value && "bg-background",
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                >
                    {value === color.value && (
                        <Check className="h-3 w-3 text-white drop-shadow-sm" strokeWidth={3} />
                    )}
                </button>
            ))}
        </div>
    );
}
