import React from "react";
import Link from "next/link";
import { DESIGN_PRESETS, AVAILABLE_FONTS } from "@/modules/design/presets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Palette, Sparkles, Type, Sliders, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DesignPresetsCatalogPage() {
  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Palette className="h-6 w-6 text-pink-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Design Engine Presets (5)
          </h1>
        </div>
        <p className="text-sm text-slate-400 max-w-3xl">
          Modular design presets that establish color tokens, typography scales, layout modes, and motion dynamics. Every preset serves as an editable starting point rather than a rigid restriction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(DESIGN_PRESETS).map((preset) => (
          <Card
            key={preset.id}
            className="border-slate-800 bg-slate-950/70 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div
                className="h-28 p-5 flex flex-col justify-between relative overflow-hidden"
                style={{
                  backgroundColor: preset.colors.background,
                  color: preset.colors.text,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-mono uppercase px-2 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: preset.colors.surface,
                      color: preset.colors.primary,
                    }}
                  >
                    {preset.id}
                  </span>
                  <div className="flex gap-1">
                    {[preset.colors.primary, preset.colors.secondary, preset.colors.accent].map(
                      (c, i) => (
                        <div
                          key={i}
                          className="h-3.5 w-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: c }}
                        />
                      )
                    )}
                  </div>
                </div>

                <h3
                  className="text-xl font-bold tracking-tight"
                  style={{ fontFamily: `"${preset.typography.headingFont}", sans-serif` }}
                >
                  {preset.name}
                </h3>
              </div>

              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-indigo-400">{preset.tagline}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="space-y-2 border-t border-slate-800/80 pt-3 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Heading Font:</span>
                    <span className="font-semibold text-white font-mono">
                      {preset.typography.headingFont}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Body Font:</span>
                    <span className="font-semibold text-white font-mono">
                      {preset.typography.bodyFont}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Layout Mode:</span>
                    <span className="capitalize text-slate-300">
                      {preset.layout.layoutStyle}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Motion Intent:</span>
                    <span className="capitalize text-slate-300">
                      {preset.animation.animationIntensity}
                    </span>
                  </div>
                </div>

                {/* Swatch Strip */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Color Palette</span>
                  <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] font-mono">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      <div className="h-4 rounded mb-1" style={{ backgroundColor: preset.colors.primary }} />
                      <span className="text-slate-400">Primary</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      <div className="h-4 rounded mb-1" style={{ backgroundColor: preset.colors.secondary }} />
                      <span className="text-slate-400">Sec</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      <div className="h-4 rounded mb-1" style={{ backgroundColor: preset.colors.accent }} />
                      <span className="text-slate-400">Accent</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      <div className="h-4 rounded mb-1" style={{ backgroundColor: preset.colors.background }} />
                      <span className="text-slate-400">Canvas</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      <div className="h-4 rounded mb-1" style={{ backgroundColor: preset.colors.surface }} />
                      <span className="text-slate-400">Surface</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>

            <div className="p-5 pt-0">
              <Link href="/projects/new">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Apply in New Project
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Available Typography Library Reference */}
      <Card className="border-slate-800 bg-slate-950/70 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Type className="h-5 w-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">Built-in Typography Registry</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4 max-w-2xl">
          The Design Studio supports direct selection across the curated Google Font typography scales for headings and body copy:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {AVAILABLE_FONTS.map((font) => (
            <div
              key={font.name}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs"
            >
              <p className="font-semibold text-white">{font.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{font.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

