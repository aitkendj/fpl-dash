import type { FPLPosition } from "@/lib/model"

/**
 * Formation definitions for a portrait pitch, matching the FPL app
 * convention — own goal at the top, attacking downwards.
 *
 * `y` is the vertical position of the line as a percentage, where 0 is
 * the team's own goal line and 100 is the opponent's. `spread` controls
 * how the players within a line are distributed horizontally.
 */
export interface FormationLine {
  positions: FPLPosition[]
  y: number
  spread: number
}

export const FORMATIONS: Record<string, FormationLine[]> = {
  "3-4-3": [
    { positions: ["GK"], y: 7, spread: 0 },
    { positions: ["DEF", "DEF", "DEF"], y: 27, spread: 62 },
    { positions: ["MID", "MID", "MID", "MID"], y: 53, spread: 78 },
    { positions: ["FWD", "FWD", "FWD"], y: 79, spread: 62 },
  ],
  "3-5-2": [
    { positions: ["GK"], y: 7, spread: 0 },
    { positions: ["DEF", "DEF", "DEF"], y: 26, spread: 62 },
    { positions: ["MID", "MID", "MID", "MID", "MID"], y: 51, spread: 88 },
    { positions: ["FWD", "FWD"], y: 79, spread: 44 },
  ],
  "4-3-3": [
    { positions: ["GK"], y: 7, spread: 0 },
    { positions: ["DEF", "DEF", "DEF", "DEF"], y: 26, spread: 74 },
    { positions: ["MID", "MID", "MID"], y: 52, spread: 52 },
    { positions: ["FWD", "FWD", "FWD"], y: 79, spread: 62 },
  ],
  "4-4-2": [
    { positions: ["GK"], y: 7, spread: 0 },
    { positions: ["DEF", "DEF", "DEF", "DEF"], y: 26, spread: 74 },
    { positions: ["MID", "MID", "MID", "MID"], y: 52, spread: 74 },
    { positions: ["FWD", "FWD"], y: 79, spread: 44 },
  ],
  "5-3-2": [
    { positions: ["GK"], y: 7, spread: 0 },
    { positions: ["DEF", "DEF", "DEF", "DEF", "DEF"], y: 25, spread: 84 },
    { positions: ["MID", "MID", "MID"], y: 52, spread: 52 },
    { positions: ["FWD", "FWD"], y: 79, spread: 44 },
  ],
}

/**
 * The minimum a player needs for formation placement.
 */
export interface FormationPlayer {
  id: number
  position: FPLPosition
  isCaptain: boolean
  isViceCaptain: boolean
  isSubstitute: boolean
}

export interface FormationSlot<T extends FormationPlayer = FormationPlayer> {
  role: FPLPosition
  /** Percentage across the pitch (0 = left touchline, 100 = right) */
  x: number
  /** Percentage down the pitch (0 = own goal, 100 = opponent goal) */
  y: number
  player: T
}

/**
 * Distribute a line of players horizontally, centred on the halfway line.
 */
function spreadX(index: number, count: number, spread: number): number {
  if (count === 1) return 50
  const step = spread / (count - 1)
  return 50 - spread / 2 + step * index
}

/**
 * Build the positional slot list for a formation, assigning the given
 * starters to slots in order.
 */
export function buildFormationSlots<T extends FormationPlayer>(
  formation: string,
  starters: T[]
): FormationSlot<T>[] {
  const lines = FORMATIONS[formation] ?? FORMATIONS["3-4-3"]
  const slots: FormationSlot<T>[] = []

  let cursor = 0

  for (const line of lines) {
    const count = line.positions.length

    line.positions.forEach((role, index) => {
      const player = starters[cursor++]
      if (!player) return

      slots.push({
        role,
        x: spreadX(index, count, line.spread),
        y: line.y,
        player,
      })
    })
  }

  return slots
}

/**
 * Select the starting XI from the squad, respecting formation needs.
 *
 * Players are consumed from a per-position pool so the same player is
 * never selected twice. If the squad cannot fill a slot exactly, the
 * best remaining outfield player is used as a fallback.
 */
export function selectStartingEleven<T extends FormationPlayer>(
  squad: T[],
  formation: string
): T[] {
  const lines = FORMATIONS[formation] ?? FORMATIONS["3-4-3"]
  const needed: FPLPosition[] = lines.flatMap((line) => line.positions)

  // Build a consumable pool per position from the non-substitutes
  const pools = new Map<FPLPosition, T[]>()
  for (const player of squad) {
    if (player.isSubstitute) continue
    const pool = pools.get(player.position) ?? []
    pool.push(player)
    pools.set(player.position, pool)
  }

  // Outfield players eligible to fill an unfilled slot
  const outfieldFallback = squad.filter(
    (p) => !p.isSubstitute && p.position !== "GK"
  )

  const selected: T[] = []
  const used = new Set<number>()

  for (const position of needed) {
    const pool = pools.get(position)
    let candidate = pool?.find((p: T) => !used.has(p.id))

    // Fall back to any unused outfield player so the XI is always full
    if (!candidate) {
      candidate = outfieldFallback.find((p: T) => !used.has(p.id))
    }

    if (candidate) {
      used.add(candidate.id)
      selected.push(candidate)
    }
  }

  return selected
}

/**
 * Players on the bench.
 */
export function selectSubstitutes<T extends FormationPlayer>(squad: T[]): T[] {
  return squad.filter((p) => p.isSubstitute)
}
