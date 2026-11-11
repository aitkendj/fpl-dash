import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { FPLPosition } from "@/data/squad"

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

type BadgeTone =
  | "neutral"
  | "positive"
  | "negative"
  | "caution"
  | "outline"
  | "inverse"

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tone === "neutral" && "bg-surface-subtle text-ink-secondary",
        tone === "positive" && "bg-positive-wash text-positive",
        tone === "negative" && "bg-negative-wash text-negative",
        tone === "caution" && "bg-caution-wash text-caution",
        tone === "outline" && "border border-line text-ink-secondary",
        tone === "inverse" && "bg-ink text-ink-inverse",
        className
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Position badge                                                      */
/* ------------------------------------------------------------------ */

const POSITION_TONE: Record<FPLPosition, BadgeTone> = {
  GK: "caution",
  DEF: "neutral",
  MID: "outline",
  FWD: "positive",
}

export function PositionBadge({
  position,
  className,
}: {
  position: FPLPosition
  className?: string
}) {
  return (
    <Badge tone={POSITION_TONE[position]} className={className}>
      {position}
    </Badge>
  )
}

/* ------------------------------------------------------------------ */
/* Club badge                                                          */
/* ------------------------------------------------------------------ */

export function ClubBadge({
  code,
  className,
}: {
  code: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-9 items-center justify-center rounded bg-surface-sunken text-2xs font-bold tracking-wide text-ink-secondary",
        className
      )}
    >
      {code}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Captain / vice-captain markers                                      */
/* ------------------------------------------------------------------ */

export function CaptainBadge({ kind = "captain" }: { kind?: "captain" | "vice" }) {
  return (
    <span
      title={kind === "captain" ? "Captain" : "Vice-captain"}
      className={cn(
        "inline-flex items-center rounded px-1 py-px text-2xs font-bold uppercase tracking-wider",
        kind === "captain"
          ? "bg-ink text-ink-inverse"
          : "bg-surface-sunken text-ink-secondary"
      )}
    >
      {kind === "captain" ? "C" : "VC"}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Status dot                                                          */
/* ------------------------------------------------------------------ */

export function StatusDot({
  status,
  className,
}: {
  status: "available" | "injured" | "suspended" | "doubtful"
  className?: string
}) {
  const map = {
    available: { color: "bg-positive", label: "Available" },
    injured: { color: "bg-negative", label: "Injured" },
    suspended: { color: "bg-caution", label: "Suspended" },
    doubtful: { color: "bg-caution", label: "Doubtful" },
  } as const

  const { color, label } = map[status]

  return (
    <span
      title={label}
      className={cn("inline-block h-1.5 w-1.5 rounded-full", color, className)}
    />
  )
}
