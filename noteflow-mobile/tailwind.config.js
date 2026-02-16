/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        "primary-light": "#818cf8",
        "primary-dark": "#4f46e5",
        surface: {
          light: "#f5f5f5",
          dark: "#262626",
        },
        border: {
          light: "#e5e5e5",
          dark: "#333333",
        },
      },
    },
  },
  plugins: [],
};
