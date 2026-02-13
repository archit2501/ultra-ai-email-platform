"use client"

import { useEffect, useState } from "react"

export interface ThemeColors {
  primary: string
  accent: string
  radius: string
}

export interface ThemePreset {
  name: string
  label: string
  colors: ThemeColors
}

export const themePresets: ThemePreset[] = [
  {
    name: "default",
    label: "Cyberpunk Blue",
    colors: {
      primary: "217.2 91.2% 59.8%",
      accent: "271.5 81.3% 55.9%",
      radius: "0.5rem",
    },
  },
  {
    name: "emerald",
    label: "Emerald Dream",
    colors: {
      primary: "142.1 76.2% 36.3%",
      accent: "168 76% 42%",
      radius: "0.5rem",
    },
  },
  {
    name: "rose",
    label: "Rose Twilight",
    colors: {
      primary: "346.8 77.2% 49.8%",
      accent: "280 77% 49%",
      radius: "0.5rem",
    },
  },
  {
    name: "amber",
    label: "Amber Glow",
    colors: {
      primary: "38 92% 50%",
      accent: "27 96% 61%",
      radius: "0.5rem",
    },
  },
  {
    name: "cyan",
    label: "Cyan Ocean",
    colors: {
      primary: "199 89% 48%",
      accent: "187 85% 53%",
      radius: "0.5rem",
    },
  },
  {
    name: "purple",
    label: "Purple Haze",
    colors: {
      primary: "271.5 81.3% 55.9%",
      accent: "290 78% 52%",
      radius: "0.5rem",
    },
  },
  {
    name: "orange",
    label: "Orange Sunset",
    colors: {
      primary: "24.6 95% 53.1%",
      accent: "15 90% 60%",
      radius: "0.5rem",
    },
  },
  {
    name: "teal",
    label: "Teal Matrix",
    colors: {
      primary: "173 80% 40%",
      accent: "183 75% 42%",
      radius: "0.5rem",
    },
  },
]

const STORAGE_KEY = "metaminds-theme-customization"

export function useThemeCustomizer() {
  const [colors, setColors] = useState<ThemeColors>(themePresets[0].colors)
  const [mounted, setMounted] = useState(false)

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setColors(parsed)
        applyThemeColors(parsed)
      } catch (error) {
        console.error("Failed to parse saved theme:", error)
      }
    }
    setMounted(true)
  }, [])

  // Apply theme colors to CSS variables
  const applyThemeColors = (themeColors: ThemeColors) => {
    const root = document.documentElement
    root.style.setProperty("--primary", themeColors.primary)
    root.style.setProperty("--accent", themeColors.accent)
    root.style.setProperty("--radius", themeColors.radius)

    // Also update computed colors
    root.style.setProperty("--ring", themeColors.primary)
    root.style.setProperty("--glow-primary", themeColors.primary)
    root.style.setProperty("--glow-accent", themeColors.accent)
  }

  // Update theme colors
  const updateColors = (newColors: Partial<ThemeColors>) => {
    const updated = { ...colors, ...newColors }
    setColors(updated)
    applyThemeColors(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // Apply preset
  const applyPreset = (presetName: string) => {
    const preset = themePresets.find((p) => p.name === presetName)
    if (preset) {
      setColors(preset.colors)
      applyThemeColors(preset.colors)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preset.colors))
    }
  }

  // Reset to default
  const resetTheme = () => {
    const defaultColors = themePresets[0].colors
    setColors(defaultColors)
    applyThemeColors(defaultColors)
    localStorage.removeItem(STORAGE_KEY)
  }

  // Get current preset name (if matches any preset)
  const getCurrentPreset = () => {
    const preset = themePresets.find(
      (p) =>
        p.colors.primary === colors.primary &&
        p.colors.accent === colors.accent &&
        p.colors.radius === colors.radius
    )
    return preset?.name || "custom"
  }

  return {
    colors,
    updateColors,
    applyPreset,
    resetTheme,
    getCurrentPreset,
    mounted,
  }
}
