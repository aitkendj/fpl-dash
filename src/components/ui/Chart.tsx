"use client"

import type { ReactNode } from "react"
import type { TooltipContentProps } from "recharts"

/* ------------------------------------------------------------------ */
/* Axis styling shared by every chart                                  */
/* ------------------------------------------------------------------ */

export const chartAxisProps = {
  stroke: "var(--color-line)",
  tick: { fontSize: 11, fill: "var(--color-ink-tertiary)" },
  axisLine: false,
  tickLine: false,
} as const

/* ------------------------------------------------------------------ */
/* Custom tooltip                                                      */
/* ------------------------------------------------------------------ */

export type TooltipFormatter = (
  value: number,
  name: string
) => [ReactNode, ReactNode]

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: Partial<
  Pick<TooltipContentProps<number, string>, "active" | "payload" | "label">
> & {
  formatter?: TooltipFormatter
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-card border border-line bg-surface px-3 py-2 shadow-overlay">
      <p className="text-2xs font-semibold uppercase tracking-[0.09em] text-ink-tertiary">
        {label}
      </p>
      <div className="mt-1 space-y-0.5">
        {payload.map((entry, index) => {
          const value = Number(entry.value ?? 0)
          const name = String(entry.dataKey ?? "")
          const [formatted, displayName] = formatter
            ? formatter(value, name)
            : [value, name]

          return (
            <div key={index} className="flex items-baseline gap-2">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-ink-secondary">{displayName}</span>
              <span
                data-numeric
                className="ml-auto text-sm font-semibold text-ink"
              >
                {formatted}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
