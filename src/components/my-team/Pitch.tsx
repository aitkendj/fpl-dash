import type { FPLPosition } from "@/lib/model"
import { cn } from "@/lib/utils"

/**
 * Portrait pitch, matching the FPL app convention — own goal at the top,
 * attacking downwards.
 *
 * The pitch box has a fixed 2:3 aspect ratio so the markings never
 * distort and the player tokens always land on the right coordinates.
 * The bench is pinned to the bottom of the same view, the way the FPL
 * app presents a squad.
 */
export interface PitchToken {
  id: number
  webName: string
  clubAbbrev: string
  priceTenths: number
  isCaptain: boolean
  isViceCaptain: boolean
}

export interface FormationSlot {
  role: FPLPosition
  /** Percentage across the pitch (0 = left touchline, 100 = right) */
  x: number
  /** Percentage down the pitch (0 = own goal, 100 = opponent goal) */
  y: number
  player: PitchToken
}

export interface PitchProps {
  slots: FormationSlot[]
  /** Substitutes, pinned to the bottom of the pitch view. */
  bench?: PitchToken[]
  className?: string
}

export function Pitch({ slots, bench = [], className }: PitchProps) {
  return (
    <div className={cn("bg-pitch", className)}>
      {/* Pitch */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {/* Markings — viewBox matches the 2:3 aspect exactly */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 150"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {/* Mown stripes */}
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x={2}
              y={2 + i * 12.17}
              width={96}
              height={12.17}
              fill={i % 2 === 0 ? "rgba(255,255,255,0.62)" : "transparent"}
            />
          ))}

          {/* Outer boundary */}
          <rect
            x={2}
            y={2}
            width={96}
            height={146}
            fill="none"
            stroke="var(--color-pitch-line)"
            strokeWidth={0.35}
          />

          {/* Halfway line */}
          <line
            x1={2}
            y1={75}
            x2={98}
            y2={75}
            stroke="var(--color-pitch-line)"
            strokeWidth={0.35}
          />

          {/* Centre circle */}
          <circle
            cx={50}
            cy={75}
            r={12}
            fill="none"
            stroke="var(--color-pitch-line)"
            strokeWidth={0.35}
          />
          <circle cx={50} cy={75} r={0.7} fill="var(--color-pitch-line)" />

          {/* Penalty areas */}
          <rect
            x={22}
            y={2}
            width={56}
            height={24}
            fill="none"
            stroke="var(--color-pitch-line)"
            strokeWidth={0.35}
          />
          <rect
            x={22}
            y={124}
            width={56}
            height={24}
            fill="none"
            stroke="var(--color-pitch-line)"
            strokeWidth={0.35}
          />

          {/* Six-yard boxes */}
          <rect
            x={38}
            y={2}
            width={24}
            height={9}
            fill="none"
            stroke="var(--color-pitch-line)"
            strokeWidth={0.35}
          />
          <rect
            x={38}
            y={139}
            width={24}
            height={9}
            fill="none"
            stroke="var(--color-pitch-line)"
            strokeWidth={0.35}
          />

          {/* Penalty spots */}
          <circle cx={50} cy={16} r={0.6} fill="var(--color-pitch-line)" />
          <circle cx={50} cy={134} r={0.6} fill="var(--color-pitch-line)" />

          {/* Goals */}
          <rect x={38} y={0} width={24} height={2} fill="var(--color-line-strong)" />
          <rect x={38} y={148} width={24} height={2} fill="var(--color-line-strong)" />

          {/* Corner arcs */}
          <path
            d="M 2 4 A 4 4 0 0 0 6 2"
            fill="none"
            stroke="var(--color-pitch-line)"
            strokeWidth={0.35}
          />
          <path
            d="M 94 2 A 4 4 0 0 0 98 4"
            fill="none"
            stroke="var(--color-pitch-line)"
            strokeWidth={0.35}
          />
          <path
            d="M 2 146 A 4 4 0 0 1 6 148"
            fill="none"
            stroke="var(--color-pitch-line)"
            strokeWidth={0.35}
          />
          <path
            d="M 94 148 A 4 4 0 0 1 98 146"
            fill="none"
            stroke="var(--color-pitch-line)"
            strokeWidth={0.35}
          />
        </svg>

        {/* Starting eleven */}
        {slots.map((slot) => (
          <PitchTokenView key={slot.player.id} slot={slot} />
        ))}
      </div>

      {/* Bench — pinned to the bottom of the pitch view */}
      {bench.length > 0 && (
        <div className="border-t border-line bg-surface px-4 py-3">
          <p className="eyebrow mb-2">Bench</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            {bench.map((player) => (
              <li key={player.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-2xs font-bold",
                    player.isCaptain
                      ? "border-ink bg-ink text-ink-inverse"
                      : "border-line-strong bg-surface-subtle text-ink-secondary"
                  )}
                >
                  {initials(player.webName)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-ink">
                    {player.webName}
                  </span>
                  <span
                    data-numeric
                    className="block text-2xs text-ink-tertiary"
                  >
                    {player.clubAbbrev} · £
                    {(player.priceTenths / 10).toFixed(1)}m
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function PitchTokenView({ slot }: { slot: FormationSlot }) {
  const { player, x, y } = slot
  const isCaptain = player.isCaptain
  const isVice = player.isViceCaptain

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="group flex flex-col items-center gap-1">
        {/* Shirt */}
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold shadow-card transition-transform duration-200 group-hover:scale-105",
            isCaptain
              ? "border-ink bg-ink text-ink-inverse"
              : "border-line-strong bg-surface text-ink"
          )}
        >
          {initials(player.webName)}
        </div>

        {/* Name, club, price */}
        <div className="whitespace-nowrap text-center leading-tight">
          <div className="flex items-center justify-center gap-1">
            {isCaptain && (
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink text-[8px] font-bold text-ink-inverse">
                C
              </span>
            )}
            {isVice && (
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-surface-sunken text-[7px] font-bold text-ink-secondary">
                V
              </span>
            )}
            <span className="text-[11px] font-semibold tracking-tight text-ink">
              {player.webName}
            </span>
          </div>
          <div className="mt-px flex items-center justify-center gap-1 text-[9px] text-ink-tertiary">
            <span className="font-medium">{player.clubAbbrev}</span>
            <span className="text-line-strong">·</span>
            <span data-numeric>£{(player.priceTenths / 10).toFixed(1)}m</span>
          </div>
        </div>
      </div>
    </div>
  )
}
