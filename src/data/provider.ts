/**
 * Data provider.
 *
 * Every page reads from this module rather than importing sample data
 * directly. When the FPL API is wired up, only the implementation of
 * `getDashboardData()` changes — the components stay untouched.
 *
 * The `source` flag is surfaced in the UI so it is always obvious
 * whether the numbers on screen are real or mocked.
 */
import {
  SQUAD,
  FPL_TEAM_ID,
  PL_CLUBS,
  PL_TEAM_NAMES,
  PL_TEAM_ABBREV,
  type SquadMember,
  type FPLPosition,
} from "@/data/squad"
import { MARKET_PLAYERS, type MarketPlayer } from "@/data/market"
import {
  SEASON_GAMEWEEKS,
  SEASON_SUMMARY,
  SEASON_LENGTH,
  CURRENT_GAMEWEEK,
  TOTAL_MANAGERS,
  type GameweekData,
} from "@/data/season"

export type {
  SquadMember,
  MarketPlayer,
  GameweekData,
  FPLPosition,
}

export interface DashboardData {
  teamId: number
  currentGameweek: number
  seasonLength: number
  totalManagers: number
  squad: SquadMember[]
  market: MarketPlayer[]
  gameweeks: GameweekData[]
  season: typeof SEASON_SUMMARY
  clubs: typeof PL_CLUBS
  clubNames: Record<number, string>
  clubAbbrevs: Record<number, string>
  source: "sample" | "live"
}

/**
 * Assemble everything the dashboard needs in one place.
 */
export function getDashboardData(): DashboardData {
  return {
    teamId: FPL_TEAM_ID,
    currentGameweek: CURRENT_GAMEWEEK,
    seasonLength: SEASON_LENGTH,
    totalManagers: TOTAL_MANAGERS,
    squad: SQUAD.filter((p) => p.in_team),
    market: MARKET_PLAYERS,
    gameweeks: SEASON_GAMEWEEKS,
    season: SEASON_SUMMARY,
    clubs: PL_CLUBS,
    clubNames: PL_TEAM_NAMES,
    clubAbbrevs: PL_TEAM_ABBREV,
    source: "sample",
  }
}
