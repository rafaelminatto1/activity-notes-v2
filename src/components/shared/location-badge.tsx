"use client";

import { useGeolocation } from "@/hooks/use-geolocation";
import { updateDocument } from "@/lib/firebase/firestore";
import { MapPin, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LocationBadgeProps {
  documentId: string;
  initialLocation?: { latitude: number; longitude: number };
}

export function LocationBadge({ documentId, initialLocation }: LocationBadgeProps) {
  const { coords, error } = useGeolocation();
  const [savedLocation, setSavedLocation] = useState(initialLocation);
  const [saving, setSaving] = useState(false);

  const handleAddLocation = async () => {
    if (!coords) return;
    setSaving(true);
    try {
      await updateDocument(documentId, { 
        location: { 
          latitude: coords.latitude, 
          longitude: coords.longitude 
        } 
      });
      setSavedLocation(coords);
      toast.success("Localização adicionada!");
    } catch {
      toast.error("Erro ao salvar localização.");
    } finally {
      setSaving(false);
    }
  };

  if (savedLocation) {
    return (
      <div className="flex items-center text-xs text-muted-foreground gap-1" title={`${savedLocation.latitude}, ${savedLocation.longitude}`}>
        <MapPin className="h-3 w-3" />
        <span>Local salvo</span>
      </div>
    );
  }

  if (error) return null;

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-6 text-xs gap-1 px-2" 
      onClick={handleAddLocation}
      disabled={!coords || saving}
    >
      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
      {coords ? "Adicionar Local" : "Localizando..."}
    </Button>
  );
}
