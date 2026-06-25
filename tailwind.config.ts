import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import rtl from "tailwindcss-rtl";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-strong": "rgb(var(--surface-strong) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-dim": "rgb(var(--accent-dim) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        "text-primary": "rgb(var(--text-primary) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)"
      },
      fontFamily: {
        arabic: ["var(--font-arabic)", "Noto Sans Arabic", "sans-serif"],
        number: ["var(--font-geist-mono)", "Geist Mono", "monospace"]
      },
      boxShadow: {
        panel: "0 18px 45px rgba(0, 0, 0, 0.22)"
      }
    }
  },
  plugins: [forms, rtl]
};

export default config;
