/**
 * Sample season data.
 *
 * The gameweek ledger is the single source of truth for season totals —
 * every headline figure elsewhere is derived from it rather than
 * hard-coded, so the numbers can never drift apart.
 */
export interface GameweekData {
  gameweek: number
  points: number
  overall_rank: number
}

export const SEASON_GAMEWEEKS: GameweekData[] = [
  { gameweek: 1, points: 68, overall_rank: 15620 },
  { gameweek: 2, points: 52, overall_rank: 18340 },
  { gameweek: 3, points: 61, overall_rank: 14200 },
  { gameweek: 4, points: 73, overall_rank: 12800 },
  { gameweek: 5, points: 58, overall_rank: 14560 },
  { gameweek: 6, points: 65, overall_rank: 13800 },
  { gameweek: 7, points: 49, overall_rank: 16200 },
  { gameweek: 8, points: 71, overall_rank: 12500 },
  { gameweek: 9, points: 63, overall_rank: 13400 },
  { gameweek: 10, points: 55, overall_rank: 15100 },
  { gameweek: 11, points: 69, overall_rank: 12900 },
  { gameweek: 12, points: 74, overall_rank: 11800 },
  { gameweek: 13, points: 66, overall_rank: 13200 },
  { gameweek: 14, points: 59, overall_rank: 14100 },
  { gameweek: 15, points: 72, overall_rank: 12400 },
  { gameweek: 16, points: 61, overall_rank: 13800 },
  { gameweek: 17, points: 54, overall_rank: 15200 },
  { gameweek: 18, points: 82, overall_rank: 10500 },
  { gameweek: 19, points: 48, overall_rank: 16800 },
  { gameweek: 20, points: 62, overall_rank: 14300 },
  { gameweek: 21, points: 75, overall_rank: 11500 },
  { gameweek: 22, points: 68, overall_rank: 12200 },
  { gameweek: 23, points: 57, overall_rank: 14800 },
  { gameweek: 24, points: 70, overall_rank: 12600 },
  { gameweek: 25, points: 65, overall_rank: 13500 },
  { gameweek: 26, points: 78, overall_rank: 11200 },
  { gameweek: 27, points: 63, overall_rank: 13900 },
  { gameweek: 28, points: 81, overall_rank: 10800 },
  { gameweek: 29, points: 67, overall_rank: 12700 },
  { gameweek: 30, points: 72, overall_rank: 12100 },
  { gameweek: 31, points: 69, overall_rank: 12500 },
  { gameweek: 32, points: 85, overall_rank: 10200 },
  { gameweek: 33, points: 71, overall_rank: 11800 },
  { gameweek: 34, points: 68, overall_rank: 12400 },
  { gameweek: 35, points: 75, overall_rank: 11500 },
  { gameweek: 36, points: 80, overall_rank: 11000 },
  { gameweek: 37, points: 62, overall_rank: 11800 },
  { gameweek: 38, points: 78, overall_rank: 11200 },
]

/** Number of gameweeks in a standard FPL season. */
export const SEASON_LENGTH = 38

/** The gameweek currently being played. */
export const CURRENT_GAMEWEEK = 38

const totalPoints = SEASON_GAMEWEEKS.reduce((sum, gw) => sum + gw.points, 0)

/**
 * Season summary derived from the ledger.
 */
export const SEASON_SUMMARY = {
  total_points: totalPoints,
  average_points_per_game: Number((totalPoints / SEASON_GAMEWEEKS.length).toFixed(1)),
  best_gameweek: SEASON_GAMEWEEKS.reduce((best, gw) =>
    gw.points > best.points ? gw : best
  ),
  worst_gameweek: SEASON_GAMEWEEKS.reduce((worst, gw) =>
    gw.points < worst.points ? gw : worst
  ),
  /** Rank after the most recent gameweek. */
  overall_rank: SEASON_GAMEWEEKS[SEASON_GAMEWEEKS.length - 1].overall_rank,
  /** Rank change against the previous gameweek. */
  rank_change:
    SEASON_GAMEWEEKS[SEASON_GAMEWEEKS.length - 1].overall_rank -
    SEASON_GAMEWEEKS[SEASON_GAMEWEEKS.length - 2].overall_rank,
  /** Points in the most recent gameweek. */
  latest_gameweek_points:
    SEASON_GAMEWEEKS[SEASON_GAMEWEEKS.length - 1].points,
  /** Points in the gameweek before the most recent one. */
  previous_gameweek_points:
    SEASON_GAMEWEEKS[SEASON_GAMEWEEKS.length - 2].points,
}

/** Total managers in the FPL, used for rank context. */
export const TOTAL_MANAGERS = 11_200_000
