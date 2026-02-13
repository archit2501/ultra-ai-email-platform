"use client"

import * as React from "react"
import { Palette, RotateCcw, Check } from "lucide-react"
import { useThemeCustomizer, themePresets } from "@/hooks/use-theme-customizer"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function ThemeCustomizer() {
  const { applyPreset, resetTheme, getCurrentPreset, mounted } =
    useThemeCustomizer()
  const [open, setOpen] = React.useState(false)
  const currentPreset = getCurrentPreset()

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Palette className="h-5 w-5 text-slate-300" />
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Customize theme"
        >
          <Palette className="h-5 w-5 text-slate-300" />
          {currentPreset !== "default" && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Theme Customization</h3>
            <p className="text-sm text-muted-foreground">
              Choose your preferred color scheme
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Color Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {themePresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    applyPreset(preset.name)
                    setOpen(false)
                  }}
                  className={cn(
                    "relative rounded-lg border-2 p-3 text-left transition-all hover:border-primary/50",
                    currentPreset === preset.name
                      ? "border-primary bg-accent/50"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{preset.label}</span>
                    {currentPreset === preset.name && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="h-6 w-full rounded"
                      style={{
                        backgroundColor: `hsl(${preset.colors.primary})`,
                      }}
                    />
                    <div
                      className="h-6 w-full rounded"
                      style={{
                        backgroundColor: `hsl(${preset.colors.accent})`,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetTheme()
              setOpen(false)
            }}
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Floating customizer button (alternative placement)
export function ThemeCustomizerFloating() {
  const { applyPreset, resetTheme, getCurrentPreset, mounted } =
    useThemeCustomizer()
  const [open, setOpen] = React.useState(false)
  const currentPreset = getCurrentPreset()

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-premium-lg"
            aria-label="Customize theme"
          >
            <Palette className="h-5 w-5" />
            {currentPreset !== "default" && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-background border-2 border-primary" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="left" className="w-80 mr-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Theme Customization</h3>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Color Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {themePresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      applyPreset(preset.name)
                    }}
                    className={cn(
                      "relative rounded-lg border-2 p-3 text-left transition-all hover:border-primary/50",
                      currentPreset === preset.name
                        ? "border-primary bg-accent/50"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {preset.label}
                      </span>
                      {currentPreset === preset.name && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex gap-1">
                      <div
                        className="h-6 w-full rounded"
                        style={{
                          backgroundColor: `hsl(${preset.colors.primary})`,
                        }}
                      />
                      <div
                        className="h-6 w-full rounded"
                        style={{
                          backgroundColor: `hsl(${preset.colors.accent})`,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetTheme()
              }}
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Default
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Inline customizer panel (for settings pages)
export function ThemeCustomizerPanel() {
  const { applyPreset, resetTheme, getCurrentPreset, mounted } =
    useThemeCustomizer()
  const currentPreset = getCurrentPreset()

  if (!mounted) {
    return <div className="h-64 animate-pulse bg-muted rounded-lg" />
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Color Scheme</h3>
        <p className="text-sm text-muted-foreground">
          Customize your interface colors
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {themePresets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset.name)}
            className={cn(
              "relative rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50 hover:scale-105",
              currentPreset === preset.name
                ? "border-primary bg-accent/50 ring-2 ring-primary/20"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">{preset.label}</span>
              {currentPreset === preset.name && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="flex gap-1.5">
              <div
                className="h-8 w-full rounded shadow-sm"
                style={{
                  backgroundColor: `hsl(${preset.colors.primary})`,
                }}
              />
              <div
                className="h-8 w-full rounded shadow-sm"
                style={{
                  backgroundColor: `hsl(${preset.colors.accent})`,
                }}
              />
            </div>
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={resetTheme}
        className="w-full md:w-auto"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset to Default
      </Button>
    </div>
  )
}
