export const useTheme = vi.fn().mockReturnValue({
  theme: "light",
  setTheme: vi.fn(),
  resolvedTheme: "light",
  themes: ["light", "dark", "system"],
  systemTheme: "light",
});
