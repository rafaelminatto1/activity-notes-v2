"use client";

import { useEffect } from "react";
import { useAuth } from "./use-auth";

const CONTENT_WIDTH_MAP: Record<string, string> = {
  narrow: "640px",
  medium: "720px",
  wide: "960px",
};

export function useSettings() {
  const { userProfile } = useAuth();
  const settings = userProfile?.settings;

  useEffect(() => {
    const html = document.documentElement;

    // Font size
    const fontSize = settings?.fontSize || "medium";
    html.setAttribute("data-font-size", fontSize);

    // Content width
    const contentWidth = settings?.contentWidth || "medium";
    html.style.setProperty(
      "--content-max-width",
      CONTENT_WIDTH_MAP[contentWidth] || "720px"
    );

    // Palette
    const palette = settings?.colorPalette || "default";
    html.setAttribute("data-palette", palette);

    // Density
    const density = settings?.density || "normal";
    html.setAttribute("data-density", density);

    // Font
    const font = settings?.editorFont || "sans";
    html.setAttribute("data-font", font);
  }, [
    settings?.fontSize,
    settings?.contentWidth,
    settings?.colorPalette,
    settings?.density,
    settings?.editorFont,
  ]);
}
