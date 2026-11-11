import type { SquadMember } from "@/data/squad"
import {
  round,
  resolveCaptaincy,
  teamExpectedPoints,
  type FplPlayer,
} from "@/lib/transfers"

/**
 * FPL Calculations Module
 *
 * Point arithmetic and season maths. Transfer simulation lives in
 * `@/lib/transfers` — see `simulateTransfers` there for the single
 * authoritative implementation of transfer effects.
 *
 * All inputs are sample data today; the functions are written against
 * stable shapes so live API data can be substituted without changes.
 */

/* ------------------------------------------------------------------ */
/* Team projections                                                    */
/* ------------------------------------------------------------------ */

/**
 * Total team expected points for the upcoming gameweek.
 *
 * The captain (and the vice-captain, where the captain is unavailable)
 * receives the standard 2x multiplier — this applies to every position
 * including goalkeepers.
 */
export function calculateTeamExpectedPoints(
  squad: Pick<FplPlayer, "id" | "expected_points" | "is_captain" | "is_vice_captain">[],
  captainId?: number
): number {
  return teamExpectedPoints(squad, captainId)
}

/**
 * Total points scored by the squad over the season, excluding the
 * captain multiplier. The difference between this and the manager's
 * season total is the captain bonus.
 */
export function calculateTotalPoints(
  squad: Pick<SquadMember, "total_points">[]
): number {
  return squad.reduce((sum, player) => sum + (player.total_points ?? 0), 0)
}

/**
 * Average points per gameweek.
 */
export function calculateAveragePointsPerGame(
  squad: Pick<SquadMember, "total_points">[],
  gameweeks: number
): number {
  if (gameweeks <= 0) return 0
  return round(calculateTotalPoints(squad) / gameweeks)
}

/**
 * Best gameweek (highest points scored).
 */
export function findBestGameweek<
  T extends { gameweek: number; points: number }
>(gameweekData: T[]): T {
  return gameweekData.reduce((best, gw) =>
    gw.points > best.points ? gw : best
  )
}

/**
 * Worst gameweek (lowest points scored).
 */
export function findWorstGameweek<
  T extends { gameweek: number; points: number }
>(gameweekData: T[]): T {
  return gameweekData.reduce((worst, gw) =>
    gw.points < worst.points ? gw : worst
  )
}

/**
 * Who holds the captain's armband, and who is vice-captain.
 * Re-exported from the transfer module so callers have one import site.
 */
export { resolveCaptaincy, teamExpectedPoints }

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export { round }

/* ------------------------------------------------------------------ */
/* Data source                                                         */
/* ------------------------------------------------------------------ */

export const dataSource = {
  isSample: true,
  label: "Sample data",
} as const

export function getDataSourceLabel(): string {
  return dataSource.isSample ? "Sample Data (Mock)" : "Live Data (API)"
}
