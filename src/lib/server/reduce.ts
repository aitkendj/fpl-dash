import type {
  FplBootstrap,
  FplElement,
  FplElementType,
  FplEvent,
  FplFixture,
  FplTeam,
} from "./types"
import type { SqPayload, SqRow } from "./types"

/**
 * Reduction of upstream payloads to the fields the dashboard uses.
 *
 * Both upstream feeds are large — the FPL bootstrap is ~1.8MB and the
 * Sideline Quant feed ~1.4MB. Both exceed Next.js's data cache limit
 * when serialised, so caching the response as-is silently fails and
 * every request re-downloads it.
 *
 * Reducing first brings them to ~390KB and ~560KB, which cache cleanly
 * and cut bandwidth substantially.
 */

/* ------------------------------------------------------------------ */
/* FPL bootstrap                                                       */
/* ------------------------------------------------------------------ */

export interface ReducedElement {
  id: number
  first_name: string
  second_name: string
  web_name: string
  element_type: number
  team: number
  now_cost: number
  ep_next: string | number
  ep_this: string | number
  total_points: number
  event_points: number
  form: string | number
  minutes: number
  starts: number
  status: string
  news: string
  selected_by_percent: string | number
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
  chance_of_playing_next_round: number | null
  transfers_in_event: number
  transfers_out_event: number
}

export interface ReducedTeam {
  id: number
  name: string
  short_name: string
  played: number
  win: number
  draw: number
  loss: number
  position: number
}

export interface ReducedEvent {
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
}

export interface ReducedElementType {
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

export interface ReducedBootstrap {
  elements: ReducedElement[]
  teams: ReducedTeam[]
  events: ReducedEvent[]
  element_types: ReducedElementType[]
}

export interface ReducedFixture {
  id: number
  event: number
  kickoff_time: string
  team_h: number
  team_a: number
  started: boolean
  finished: boolean
}

const ELEMENT_FIELDS: (keyof ReducedElement)[] = [
  "id",
  "first_name",
  "second_name",
  "web_name",
  "element_type",
  "team",
  "now_cost",
  "ep_next",
  "ep_this",
  "total_points",
  "event_points",
  "form",
  "minutes",
  "starts",
  "status",
  "news",
  "selected_by_percent",
  "goals_scored",
  "assists",
  "clean_sheets",
  "goals_conceded",
  "bonus",
  "bps",
  "saves",
  "yellow_cards",
  "red_cards",
  "own_goals",
  "penalties_saved",
  "penalties_missed",
  "squad_number",
  "chance_of_playing_next_round",
  "transfers_in_event",
  "transfers_out_event",
]

export function reduceElement(element: FplElement): ReducedElement {
  const reduced = {} as ReducedElement
  for (const field of ELEMENT_FIELDS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(reduced as any)[field] = element[field]
  }
  return reduced
}

export function reduceBootstrap(bootstrap: FplBootstrap): ReducedBootstrap {
  return {
    elements: bootstrap.elements.map(reduceElement),
    teams: bootstrap.teams.map((team: FplTeam) => ({
      id: team.id,
      name: team.name,
      short_name: team.short_name,
      played: team.played,
      win: team.win,
      draw: team.draw,
      loss: team.loss,
      position: team.position,
    })),
    events: bootstrap.events.map((event: FplEvent) => ({
      id: event.id,
      name: event.name,
      deadline_time: event.deadline_time,
      finished: event.finished,
      is_current: event.is_current,
      is_previous: event.is_previous,
      is_next: event.is_next,
      average_entry_score: event.average_entry_score,
      highest_score: event.highest_score,
      ranked_count: event.ranked_count,
    })),
    element_types: bootstrap.element_types.map((type: FplElementType) => ({
      id: type.id,
      singular_name: type.singular_name,
      singular_name_short: type.singular_name_short,
      plural_name: type.plural_name,
      plural_name_short: type.plural_name_short,
      squad_select: type.squad_select,
      squad_min_select: type.squad_min_select,
      squad_max_select: type.squad_max_select,
      squad_min_play: type.squad_min_play,
      squad_max_play: type.squad_max_play,
    })),
  }
}

export function reduceFixtures(fixtures: FplFixture[]): ReducedFixture[] {
  return fixtures.map((fixture) => ({
    id: fixture.id,
    event: fixture.event,
    kickoff_time: fixture.kickoff_time,
    team_h: fixture.team_h,
    team_a: fixture.team_a,
    started: fixture.started,
    finished: fixture.finished,
  }))
}

/* ------------------------------------------------------------------ */
/* Sideline Quant                                                      */
/* ------------------------------------------------------------------ */

export interface ReducedSqRow {
  player_id: number
  fixture_id: number
  gameweek: number
  name: string
  web_name: string
  club: string
  position: "GK" | "DEF" | "MID" | "FWD"
  price_tenths: number
  /** Expected FPL points for this fixture. */
  xP: number
  sigma: number
  p_start: number
  p_start60: number
  p_start_sub: number
  p_cameo: number
  p_unused: number
  /** Expected minutes for this fixture. */
  e_mins: number
  /** Gameweek-level dispersion and percentiles — never summed. */
  gw_sigma: number
  gw_p10: number
  gw_p90: number
  horizon_p10: number
  horizon_p90: number
  horizon_sigma: number
  kickoff_time: string
  opponent: string
  was_home: boolean
  status: string
  form: number
  total_points: number
  owned_pct: number
  p_ge_6: number
  p_ge_10: number
  p_goal: number
  p_assist: number
  p_cs: number
}

export interface ReducedSqPayload {
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
  licence: SqPayload["licence"]
  notes: string[]
  model_accuracy: SqPayload["model_accuracy"]
  rows: ReducedSqRow[]
}

const ROW_FIELDS: (keyof ReducedSqRow)[] = [
  "player_id",
  "fixture_id",
  "gameweek",
  "name",
  "web_name",
  "club",
  "position",
  "price_tenths",
  "xP",
  "sigma",
  "p_start",
  "p_start60",
  "p_start_sub",
  "p_cameo",
  "p_unused",
  "e_mins",
  "gw_sigma",
  "gw_p10",
  "gw_p90",
  "horizon_p10",
  "horizon_p90",
  "horizon_sigma",
  "kickoff_time",
  "opponent",
  "was_home",
  "status",
  "form",
  "total_points",
  "owned_pct",
  "p_ge_6",
  "p_ge_10",
  "p_goal",
  "p_assist",
  "p_cs",
]

export function reduceSqRow(row: SqRow): ReducedSqRow {
  const reduced = {} as ReducedSqRow
  for (const field of ROW_FIELDS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(reduced as any)[field] = row[field]
  }
  return reduced
}

export function reduceSqPayload(payload: SqPayload): ReducedSqPayload {
  return {
    schema_version: payload.schema_version,
    generated_at: payload.generated_at,
    gameweek: payload.gameweek,
    deadline: payload.deadline,
    n_players: payload.n_players,
    n_rows: payload.n_rows,
    n_sims: payload.n_sims,
    source: payload.source,
    produced_by: payload.produced_by,
    canonical_url: payload.canonical_url,
    licence: payload.licence,
    notes: payload.notes ?? [],
    model_accuracy: payload.model_accuracy,
    rows: payload.rows.map(reduceSqRow),
  }
}
