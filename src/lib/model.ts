/**
 * The common player model used across the whole dashboard.
 *
 * Official FPL statistics and model predictions are kept in separate
 * fields so the interface can always distinguish between them, and so
 * a new prediction provider can be added without changing this shape.
 */

export type FPLPosition = "GK" | "DEF" | "MID" | "FWD"

export type FplStatus = "a" | "d" | "i" | "s" | "u" | "n"

export const STATUS_LABEL: Record<FplStatus, string> = {
  a: "Available",
  d: "Doubtful",
  i: "Injured",
  s: "Suspended",
  u: "Unknown",
  n: "Not in squad",
}

/* ------------------------------------------------------------------ */
/* Projections                                                          */
/* ------------------------------------------------------------------ */

/**
 * A prediction from a single source.
 */
export interface Projection {
  /** Where the projection came from. */
  source: "fpl" | "sidelinequant"
  /** Expected points for the gameweek being projected. */
  expectedPoints: number
  /** Expected minutes, when the source provides them. */
  expectedMinutes?: number
  /** Probability the player starts, 0-1. */
  startProbability?: number
  /** Simulated 10th percentile — a realistic floor. */
  floor?: number
  /** Simulated 90th percentile — a realistic ceiling. */
  ceiling?: number
  /** Number of fixtures the player has in the projected gameweek. */
  fixtures: number
}

/* ------------------------------------------------------------------ */
/* Player                                                              */
/* ------------------------------------------------------------------ */

export interface DashboardPlayer {
  /** FPL element id — stable across the season. */
  id: number
  firstName: string
  secondName: string
  webName: string

  position: FPLPosition
  /** FPL club id. */
  team: number
  clubName: string
  clubAbbrev: string

  /** Price in tenths of £m (96 = £9.6m). */
  priceTenths: number

  /* ---- Official FPL statistics (actual, not predicted) ------------- */
  totalPoints: number
  form: number
  minutes: number
  starts: number
  goals: number
  assists: number
  cleanSheets: number
  bonus: number
  bps: number
  saves: number
  yellowCards: number
  redCards: number
  /** Points in the most recent gameweek. */
  lastGameweekPoints: number
  status: FplStatus
  news: string
  selectedByPercent: number
  /** FPL's own percentage chance of playing the next round. */
  chanceOfPlaying: number | null

  /* ---- Predictions ------------------------------------------------- */
  /** FPL's own expected points for the next round. */
  fplProjection: Projection | null
  /** Sideline Quant's model projections for the next round. */
  sidelineQuantProjection: Projection | null
  /**
   * Resolved expected points for the next gameweek.
   *
   * Prefers the model projection and falls back to FPL's own figure.
   * `expectedPointsSource` records which one was used, so the interface
   * can always say where the number came from.
   */
  expectedPoints: number
  expectedPointsSource: "sidelinequant" | "fpl" | null

  /* ---- Upcoming fixture -------------------------------------------- */
  /** Number of fixtures in the next gameweek (2 in a double gameweek). */
  fixtureCount: number
  /** Opponent club names, one per fixture. */
  opponents: string[]
  /** Opponent club abbreviations, one per fixture. */
  opponentAbbrevs: string[]
  /** Kickoff times, one per fixture. */
  kickoffs: string[]
  /** True when the player is at home in every fixture. */
  atHome: boolean
}

/* ------------------------------------------------------------------ */
/* Squad                                                               */
/* ------------------------------------------------------------------ */

export interface SquadPlayer extends DashboardPlayer {
  isCaptain: boolean
  isViceCaptain: boolean
  /** True when the player is on the bench rather than in the XI. */
  isSubstitute: boolean
  /** The FPL pick position, 1-11 for the XI, 12-15 for the bench. */
  pickPosition: number
}

/* ------------------------------------------------------------------ */
/* Manager                                                             */
/* ------------------------------------------------------------------ */

export interface ManagerSummary {
  teamId: number
  name: string
  /** The gameweek currently being played. */
  currentGameweek: number
  /** The gameweek being projected. */
  nextGameweek: number
  seasonLength: number
  yearsActive: number
  totalPoints: number
  /** Points in the current gameweek. */
  eventPoints: number
  /** Points in the gameweek before the current one. */
  previousGameweekPoints: number
  overallRank: number
  eventRank: number
  /** Money in the bank, in £m (0.8 = £0.8m). */
  bank: number
  /** Squad value, in £m (102 = £102m). */
  teamValue: number
  totalTransfers: number
  favouriteTeam: number | null
}

export interface GameweekHistoryRow {
  gameweek: number
  points: number
  totalPoints: number
  overallRank: number
  rank: number
  percentileRank: number
  /** Money in the bank, in £m. */
  bank: number
  /** Squad value, in £m. */
  teamValue: number
  transfers: number
  pointsOnBench: number
}

export interface ChipUsage {
  name: string
  event: number
  time: string
}

/* ------------------------------------------------------------------ */
/* Data status                                                         */
/* ------------------------------------------------------------------ */

/**
 * Tracks the health of each external source so the interface can say
 * plainly when a figure is missing, and never present stale or
 * fabricated data as if it were live.
 */
export interface SourceStatus {
  name: "fpl" | "sidelinequant"
  label: string
  /** null when the source returned usable data. */
  error: string | null
  /** When the data was retrieved. */
  fetchedAt: Date | null
  /** True when the figures are real rather than modelled. */
  official: boolean
}

export interface DataStatus {
  sources: SourceStatus[]
  /** True when every source returned usable data. */
  complete: boolean
  /** True when any source failed. */
  degraded: boolean
}
