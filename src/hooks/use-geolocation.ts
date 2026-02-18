"use client";

import { useState, useEffect } from "react";

interface Coords {
  latitude: number;
  longitude: number;
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(() => {
    if (typeof navigator !== "undefined" && !navigator.geolocation) {
      return "Geolocalização não suportada.";
    }
    return null;
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        setError(err.message);
      }
    );
  }, []);

  return { coords, error };
}
