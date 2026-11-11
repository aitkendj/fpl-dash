/**
 * Raw response shapes from the external APIs.
 *
 * These mirror the wire format exactly — no transformation happens here.
 * Everything is typed loosely where the upstream API is loose (numbers
 * arrive as strings, for example) and normalised in `src/lib/transform`.
 */

/* ------------------------------------------------------------------ */
/* FPL — https://fantasy.premierleague.com/api/                         */
/* ------------------------------------------------------------------ */

export interface FplElement {
  id: number
  first_name: string
  second_name: string
  web_name: string
  known_name: string
  /** 1 GK, 2 DEF, 3 MID, 4 FWD */
  element_type: number
  team: number
  /** Price in tenths of £m (62 = £6.2m) — same unit as SQ price_tenths */
  now_cost: number
  /** Official expected points for the next round — arrives as a string */
  ep_next: string | number
  ep_this: string | number
  total_points: number
  /** Points in the most recent gameweek */
  event_points: number
  form: string | number
  minutes: number
  starts: number
  /** a available, d doubtful, i injured, s suspended, u unknown */
  status: string
  news: string
  selected_by_percent: string | number
  points_per_game: string | number
  goals_scored: number
  assists: number
  clean_sheets: number
  goals_conceded: number
  bonus: number
  bps: number
  saves: number
  yellow_cards: number
  red_cards: number
  own_goals: number
  penalties_saved: number
  penalties_missed: number
  squad_number: number
  dreamteam_count: number
  transfers_in_event: number
  transfers_out_event: number
  /** 0-100 */
  chance_of_playing_next_round: number | null
}

export interface FplTeam {
  id: number
  name: string
  short_name: string
  code: number
  played: number
  win: number
  draw: number
  loss: number
  goals_for: number
  goals_against: number
  points: number
  position: number
}

export interface FplEvent {
  id: number
  name: string
  deadline_time: string
  finished: boolean
  is_current: boolean
  is_previous: boolean
  is_next: boolean
  average_entry_score: number
  highest_score: number
  ranked_count: number
  most_selected: number
  most_transferred_in: number
  transfers_made: number
}

export interface FplElementType {
  id: number
  singular_name: string
  singular_name_short: string
  plural_name: string
  plural_name_short: string
  squad_select: number
  squad_min_select: number | null
  squad_max_select: number | null
  squad_min_play: number | null
  squad_max_play: number | null
}

export interface FplBootstrap {
  elements: FplElement[]
  teams: FplTeam[]
  events: FplEvent[]
  element_types: FplElementType[]
  total_players: number
}

export interface FplFixture {
  id: number
  event: number
  kickoff_time: string
  team_h: number
  team_a: number
  team_h_score: number | null
  team_a_score: number | null
  finished: boolean
  started: boolean
  minutes: number
}

/** The fixtures endpoint returns a bare array. */
export type FplFixturesResponse = FplFixture[]

export interface FplEntry {
  id: number
  name: string
  /** The gameweek the manager is currently on */
  current_event: number
  joined_time: string
  years_active: number
  /** Total points across all entered gameweeks */
  summary_overall_points: number
  /** Points in the latest gameweek */
  summary_event_points: number
  summary_overall_rank: number
  summary_event_rank: number
  /** Money in the bank, in whole £m */
  last_deadline_bank: number
  /** Squad value, in whole £m */
  last_deadline_value: number
  last_deadline_total_transfers: number
  kit: string | null
  favourite_team: number | null
}

export interface FplHistoryRow {
  event: number
  points: number
  total_points: number
  rank: number
  rank_sort: number
  overall_rank: number
  percentile_rank: number
  overall_rank_percentage: string
  /** Money in the bank, whole £m */
  bank: number
  /** Squad value, whole £m */
  value: number
  event_transfers: number
  event_transfers_cost: number
  points_on_bench: number
}

export interface FplHistory {
  current: FplHistoryRow[]
  past: {
    season_name: string
    total_points: number
    rank: number
    rank_percentage: string
  }[]
  chips: { name: string; time: string; event: number }[]
}

export interface FplPick {
  element: number
  /** 1-11 is the starting XI, 12-15 the bench */
  position: number
  /** 2 for the captain, 1 for a starter, 0 for an unused substitute */
  multiplier: number
  is_captain: boolean
  is_vice_captain: boolean
  element_type: number
}

export interface FplPicks {
  active_chip: { id: number; name: string } | null
  automatic_subs: unknown[]
  entry_history: FplHistoryRow
  picks: FplPick[]
}

/* ------------------------------------------------------------------ */
/* Sideline Quant — https://sidelinequant.com/data/                    */
/* ------------------------------------------------------------------ */

export interface SqRow {
  /** FPL element id — the join key to the official game */
  player_id: number
  /** FPL fixture id. Two rows for a player in a double gameweek. */
  fixture_id: number
  gameweek: number
  name: string
  web_name: string
  club: string
  position: "GK" | "DEF" | "MID" | "FWD"
  /** Price in tenths of £m (96 = £9.6m) */
  price_tenths: number
  /** Expected FPL points for THIS fixture */
  xP: number
  sigma: number
  /** Probability the player starts this fixture */
  p_start: number
  p_start60: number
  p_start_sub: number
  p_cameo: number
  p_unused: number
  /** Expected minutes for this fixture */
  e_mins: number
  /** Gameweek-level standard deviation — do not sum across rows */
  gw_sigma: number
  /** Gameweek-level 10th percentile (floor) — do not sum across rows */
  gw_p10: number
  /** Gameweek-level 90th percentile (ceiling) — do not sum across rows */
  gw_p90: number
  /** Season-horizon floor and ceiling */
  horizon_p10: number
  horizon_p90: number
  horizon_sigma: number
  kickoff_time: string
  opponent: string
  was_home: boolean
  /** FPL availability flag */
  status: string
  form: number
  total_points: number
  owned_pct: number
  /** Probability of the gameweek total being 6+ */
  p_ge_6: number
  /** Probability of the gameweek total being 10+ */
  p_ge_10: number
  /** Probability of scoring at least one goal */
  p_goal: number
  /** Probability of at least one assist */
  p_assist: number
  /** Probability of a clean sheet */
  p_cs: number
}

export interface SqPayload {
  schema_version: string
  generated_at: string
  gameweek: number
  deadline: string
  n_players: number
  n_rows: number
  n_sims: number
  source: string
  produced_by: string
  canonical_url: string
  licence: {
    name: string
    url: string
    attribution: string
    terms: string
  }
  notes: string[]
  model_accuracy: {
    mae: number
    rmse: number
    n: number
    population: string
    gameweeks: number[]
  }
  columns: Record<string, string>
  rows: SqRow[]
}
