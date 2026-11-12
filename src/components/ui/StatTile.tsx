import type { ReactNode } from "react"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */

export interface StatTileProps {
  label: string
  value: ReactNode
  /** Contextual line beneath the value, e.g. "of 11.2m managers" */
  meta?: ReactNode
  /** Signed change, rendered green for positive and red for negative */
  delta?: number
  deltaLabel?: string
  /** Inverts delta colouring (use when a lower value is better) */
  invertDelta?: boolean
  /** Decimal places in the delta. Use 0 for whole-number metrics. */
  deltaDecimals?: number
  icon?: ReactNode
  className?: string
  emphasis?: boolean
}

export function StatTile({
  label,
  value,
  meta,
  delta,
  deltaLabel,
  invertDelta = false,
  /** Decimal places in the delta. Use 0 for whole-number metrics. */
  deltaDecimals = 1,
  icon,
  className,
  emphasis = false,
}: StatTileProps) {
  const hasDelta = delta !== undefined
  const isFlat = hasDelta && Math.abs(delta) < 0.05
  const isGood = hasDelta && (invertDelta ? delta < 0 : delta > 0)

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-panel border border-line bg-surface px-4 py-3.5 shadow-subtle transition-shadow duration-200 hover:shadow-card",
        emphasis && "bg-surface",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {icon && (
          <span className="shrink-0 text-ink-tertiary transition-colors duration-200 group-hover:text-ink-secondary">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span
          data-numeric
          className="display-numeral text-4xl text-ink"
        >
          {value}
        </span>
      </div>

      {(meta || hasDelta) && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          {hasDelta && (
            <DeltaPill
              value={delta}
              good={isGood}
              flat={isFlat}
              decimals={deltaDecimals}
            />
          )}
          {(meta || deltaLabel) && (
            <span className="truncate text-ink-tertiary">
              {deltaLabel ?? meta}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Delta pill                                                          */
/* ------------------------------------------------------------------ */

export function DeltaPill({
  value,
  good,
  flat,
  suffix,
  decimals = 1,
}: {
  value: number
  good: boolean
  flat: boolean
  suffix?: string
  /** Decimal places. Use 0 for whole-number metrics like rank. */
  decimals?: number
}) {
  const Icon = flat ? Minus : good ? ArrowUpRight : ArrowDownRight

  const magnitude =
    decimals === 0
      ? formatNumber(Math.round(Math.abs(value)))
      : Math.abs(value).toFixed(decimals)

  return (
    <span
      data-numeric
      className={cn(
        "inline-flex items-center gap-0.5 rounded-pill px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        flat
          ? "bg-surface-subtle text-ink-tertiary"
          : good
            ? "bg-positive-wash text-positive"
            : "bg-negative-wash text-negative"
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {magnitude}
      {suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Inline delta text                                                   */
/* ------------------------------------------------------------------ */

export function DeltaText({
  value,
  invert = false,
  suffix,
  className,
  showIcon = false,
}: {
  value: number
  invert?: boolean
  suffix?: string
  className?: string
  showIcon?: boolean
}) {
  const isFlat = Math.abs(value) < 0.05
  const isGood = invert ? value < 0 : value > 0

  return (
    <span
      data-numeric
      className={cn(
        "inline-flex items-center gap-1 font-semibold tabular-nums",
        isFlat
          ? "text-ink-tertiary"
          : isGood
            ? "text-positive"
            : "text-negative",
        className
      )}
    >
      {showIcon && !isFlat && (
        <IconFor value={value} />
      )}
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}
      {suffix}
    </span>
  )
}

function IconFor({ value }: { value: number }) {
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight
  return <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
}
