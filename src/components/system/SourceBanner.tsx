import { AlertTriangle, CheckCircle2, Database, ExternalLink, Info } from "lucide-react"
import type { DataStatus } from "@/lib/model"
import { SQ_ATTRIBUTION } from "@/lib/attribution"
import { cn } from "@/lib/utils"

/**
 * Source health and attribution.
 *
 * Makes it plain which figures are official FPL statistics and which
 * are model projections, and states plainly when a source has failed
 * rather than quietly showing a stale or empty figure.
 */
export function SourceBanner({
  status,
  projectionGameweek,
  origin = "live",
  className,
}: {
  status: DataStatus
  projectionGameweek: number | null
  /** Whether the figures came from the live APIs or the saved snapshot */
  origin?: "live" | "snapshot"
  className?: string
}) {
  const failed = status.sources.filter((source) => source.error)

  /* ---- Saved snapshot: the live APIs were unreachable ---------------- */
  if (origin === "snapshot") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-card border border-caution/25 bg-caution-wash px-4 py-2.5",
          className
        )}
      >
        <div className="flex items-center gap-2 text-xs text-caution">
          <Info className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>
            Showing a saved snapshot — the live FPL API could not be reached.
          </span>
        </div>
        <p className="text-2xs text-caution/80">
          Figures are from the last successful capture, not the current
          gameweek.
        </p>
      </div>
    )
  }

  /* ---- Live, with one or more sources degraded ----------------------- */
  if (failed.length > 0) {
    return (
      <div
        className={cn(
          "rounded-card border border-negative/25 bg-negative-wash px-4 py-3",
          className
        )}
      >
        <div className="flex items-start gap-2.5">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-negative"
            strokeWidth={2}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-negative">
              {failed.length === 1
                ? "One data source is unavailable"
                : `${failed.length} data sources are unavailable`}
            </p>
            <ul className="mt-1.5 space-y-1">
              {failed.map((source) => (
                <li key={source.name} className="text-xs text-negative/90">
                  <span className="font-medium">{source.label}</span> —{" "}
                  {source.error}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-negative/80">
              Figures from the affected source are missing rather than
              substituted. Try again shortly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ---- Live and healthy --------------------------------------------- */
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-card border border-line bg-surface-subtle/40 px-4 py-2.5",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs text-ink-secondary">
        <CheckCircle2
          className="h-3.5 w-3.5 shrink-0 text-positive"
          strokeWidth={2}
        />
        <span>
          Live FPL data
          {projectionGameweek
            ? ` · projections for gameweek ${projectionGameweek}`
            : ""}
        </span>
      </div>

      <p className="text-2xs text-ink-tertiary">
        Projections by{" "}
        <a
          href={SQ_ATTRIBUTION.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-0.5 font-medium text-ink-secondary underline decoration-line-strong underline-offset-2 hover:text-ink"
        >
          {SQ_ATTRIBUTION.name}
          <ExternalLink className="h-2.5 w-2.5" strokeWidth={2.2} />
        </a>{" "}
        · {SQ_ATTRIBUTION.licence}
      </p>
    </div>
  )
}

/**
 * A compact indicator that a figure is an official FPL statistic.
 */
export function OfficialBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill bg-surface-subtle px-1.5 py-0.5 text-2xs font-medium text-ink-tertiary",
        className
      )}
      title="Official Fantasy Premier League statistic"
    >
      <Database className="h-2.5 w-2.5" strokeWidth={2.2} />
      FPL
    </span>
  )
}

/**
 * A compact indicator that a figure is a model projection.
 */
export function ModelBadge({
  className,
  source = "Sideline Quant",
}: {
  className?: string
  source?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill bg-model-wash px-1.5 py-0.5 text-2xs font-medium text-model",
        className
      )}
      title={`Model projection from ${source}`}
    >
      Model
    </span>
  )
}
