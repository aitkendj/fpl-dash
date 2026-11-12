import type {
  DashboardPlayer,
  FplStatus,
  ManagerSummary,
  Projection,
  SquadPlayer,
} from "@/lib/model"
import type {
  FplEntry,
  FplHistory,
  FplPicks,
} from "@/lib/server/types"
import type { ReducedSqPayload, ReducedSqRow } from "@/lib/server/reduce"
import type {
  ReducedBootstrap,
  ReducedElement,
  ReducedFixture,
} from "@/lib/server/reduce"
import { SQUAD_SLOT_LABELS } from "@/lib/positions"

/**
 * Transformations from raw API payloads into the common player model.
 *
 * Kept pure and separate from fetching so the shape of the data can be
 * tested without touching the network.
 */

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

/** FPL returns numbers as strings in several places. */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = toNumber(value, Number.NaN)
  return Number.isFinite(parsed) ? parsed : null
}

export function toStatus(value: unknown): FplStatus {
  const raw = String(value ?? "").toLowerCase()
  switch (raw) {
    case "a":
      return "a"
    case "d":
      return "d"
    case "i":
      return "i"
    case "s":
      return "s"
    case "u":
      return "u"
    default:
      return "n"
  }
}

export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/* ------------------------------------------------------------------ */
/* Official FPL element -> DashboardPlayer                             */
/* ------------------------------------------------------------------ */

const POSITION_BY_ELEMENT_TYPE: Record<number, DashboardPlayer["position"]> = {
  1: "GK",
  2: "DEF",
  3: "MID",
  4: "FWD",
}

export interface ElementContext {
  bootstrap: ReducedBootstrap
  /** Next gameweek's fixtures, keyed by team id. */
  fixturesByTeam: Map<number, ReducedFixture[]>
  /** The gameweek being projected. */
  nextGameweek: number
}

export function buildElementContext(
  bootstrap: ReducedBootstrap,
  fixtures: ReducedFixture[],
  nextGameweek: number
): ElementContext {
  const fixturesByTeam = new Map<number, ReducedFixture[]>()

  for (const fixture of fixtures) {
    if (fixture.event !== nextGameweek) continue
    for (const teamId of [fixture.team_h, fixture.team_a]) {
      const list = fixturesByTeam.get(teamId) ?? []
      list.push(fixture)
      fixturesByTeam.set(teamId, list)
    }
  }

  return { bootstrap, fixturesByTeam, nextGameweek }
}

/**
 * Convert one FPL element into the common model.
 */
export function transformElement(
  element: ReducedElement,
  context: ElementContext
): DashboardPlayer {
  const { bootstrap, fixturesByTeam } = context

  const team = bootstrap.teams.find((t) => t.id === element.team)
  const position =
    POSITION_BY_ELEMENT_TYPE[element.element_type] ?? "MID"

  const teamFixtures = fixturesByTeam.get(element.team) ?? []
  const opponents: string[] = []
  const kickoffs: string[] = []
  let atHome = true

  for (const fixture of teamFixtures) {
    const isHome = fixture.team_h === element.team
    const opponentId = isHome ? fixture.team_a : fixture.team_h
    const opponent = bootstrap.teams.find((t) => t.id === opponentId)
    opponents.push(opponent?.name ?? "Unknown")
    kickoffs.push(fixture.kickoff_time)
    if (!isHome) atHome = false
  }

  const epNext = toNullableNumber(element.ep_next)

  return {
    id: element.id,
    firstName: element.first_name,
    secondName: element.second_name,
    webName: element.web_name,

    position,
    team: element.team,
    clubName: team?.name ?? "Unknown",
    clubAbbrev: team?.short_name ?? "???",

    // FPL's now_cost is in tenths of £m, same as Sideline Quant's
    // price_tenths (62 = £6.2m).
    priceTenths: element.now_cost,

    totalPoints: element.total_points ?? 0,
    form: toNumber(element.form),
    minutes: element.minutes ?? 0,
    starts: element.starts ?? 0,
    goals: element.goals_scored ?? 0,
    assists: element.assists ?? 0,
    cleanSheets: element.clean_sheets ?? 0,
    bonus: element.bonus ?? 0,
    bps: element.bps ?? 0,
    saves: element.saves ?? 0,
    yellowCards: element.yellow_cards ?? 0,
    redCards: element.red_cards ?? 0,
    lastGameweekPoints: toNumber(element.event_points),
    status: toStatus(element.status),
    news: element.news ?? "",
    selectedByPercent: toNumber(element.selected_by_percent),
    chanceOfPlaying: toNullableNumber(element.chance_of_playing_next_round),

    fplProjection:
      epNext === null
        ? null
        : {
            source: "fpl",
            expectedPoints: epNext,
            fixtures: teamFixtures.length,
          },

    sidelineQuantProjection: null,
    expectedPoints: epNext ?? 0,
    expectedPointsSource: epNext === null ? null : "fpl",

    fixtureCount: teamFixtures.length,
    opponents,
    kickoffs,
    atHome,
  }
}

/* ------------------------------------------------------------------ */
/* Sideline Quant rows -> Projection                                    */
/* ------------------------------------------------------------------ */

/**
 * Aggregate fixture-grain projection rows into one gameweek projection.
 *
 * The rules, which matter for double gameweeks:
 *  - `xP` and `e_mins` are per-fixture, so they are **summed**.
 *  - `gw_p10`, `gw_p90` and `gw_sigma` are already gameweek-level
 *    totals, so they are **not** summed — taking the maximum is safe
 *    either way, and correct when a player has two rows.
 *  - `p_start` is per-fixture. Across several fixtures the probability
 *    of starting at least once is 1 - (1 - p1)(1 - p2)..., which is not
 *    the same as the mean.
 */
export function aggregateProjectionRows(rows: ReducedSqRow[]): Projection {
  if (rows.length === 0) {
    return {
      source: "sidelinequant",
      expectedPoints: 0,
      fixtures: 0,
    }
  }

  const expectedPoints = rows.reduce((sum, row) => sum + row.xP, 0)
  const expectedMinutes = rows.reduce((sum, row) => sum + row.e_mins, 0)

  // Probability of starting at least once across all fixtures.
  const startProbability = rows.reduce(
    (notStarted, row) => notStarted * (1 - row.p_start),
    1
  )

  // Gameweek-level percentiles are identical across a player's rows,
  // so the maximum is both safe and correct.
  const floor = Math.max(...rows.map((row) => row.gw_p10))
  const ceiling = Math.max(...rows.map((row) => row.gw_p90))

  return {
    source: "sidelinequant",
    expectedPoints: round(expectedPoints, 2),
    expectedMinutes: round(expectedMinutes),
    startProbability: round(1 - startProbability, 3),
    floor: round(floor),
    ceiling: round(ceiling),
    fixtures: rows.length,
  }
}

/**
 * Group Sideline Quant rows by player and build a lookup of projections.
 */
export function buildProjectionLookup(
  payload: ReducedSqPayload
): Map<number, Projection> {
  const rowsByPlayer = new Map<number, ReducedSqRow[]>()

  for (const row of payload.rows) {
    const list = rowsByPlayer.get(row.player_id) ?? []
    list.push(row)
    rowsByPlayer.set(row.player_id, list)
  }

  const lookup = new Map<number, Projection>()

  for (const [playerId, rows] of rowsByPlayer) {
    lookup.set(playerId, aggregateProjectionRows(rows))
  }

  return lookup
}

/**
 * Attach Sideline Quant projections to the official player list.
 *
 * Players with no projection row are left with a null projection
 * rather than being given a zero, so a missing prediction is visible
 * as missing rather than looking like a real zero.
 */
export function applyProjections(
  players: DashboardPlayer[],
  lookup: Map<number, Projection>
): DashboardPlayer[] {
  return players.map((player) => {
    const projection = lookup.get(player.id)
    if (!projection) {
      return { ...player, sidelineQuantProjection: null }
    }
    return {
      ...player,
      sidelineQuantProjection: projection,
      // The model projection takes precedence over FPL's own figure.
      expectedPoints: projection.expectedPoints,
      expectedPointsSource: "sidelinequant",
    }
  })
}

/* ------------------------------------------------------------------ */
/* Squad                                                                */
/* ------------------------------------------------------------------ */

/**
 * Join the manager's picks against the player list to build the squad.
 */
export function buildSquad(
  players: DashboardPlayer[],
  picks: FplPicks
): SquadPlayer[] {
  const byId = new Map(players.map((player) => [player.id, player]))

  return picks.picks
    .map((pick) => {
      const player = byId.get(pick.element)
      if (!player) return null

      return {
        ...player,
        isCaptain: pick.is_captain,
        isViceCaptain: pick.is_vice_captain,
        // Positions 1-11 are the starting XI, 12-15 the bench.
        isSubstitute: pick.position > 11,
        pickPosition: pick.position,
      } satisfies SquadPlayer
    })
    .filter((player): player is SquadPlayer => player !== null)
    .sort((a, b) => a.pickPosition - b.pickPosition)
}

/* ------------------------------------------------------------------ */
/* History                                                              */
/* ------------------------------------------------------------------ */

/**
 * Build the per-gameweek history rows.
 *
 * FPL reports the bank and squad value in tenths of a million, so
 * `bank: 8` is £0.8m and `value: 1020` is £102m. They are converted
 * to £m here so the interface never has to think about the unit.
 */
export function buildHistoryRows(history: FplHistory) {
  return history.current.map((row) => ({
    gameweek: row.event,
    points: row.points,
    totalPoints: row.total_points,
    overallRank: row.overall_rank,
    rank: row.rank,
    percentileRank: row.percentile_rank,
    bank: row.bank / 10,
    teamValue: row.value / 10,
    transfers: row.event_transfers,
    pointsOnBench: row.points_on_bench,
  }))
}

/**
 * The manager's headline figures.
 */
export function buildManagerSummary({
  entry,
  currentEvent,
  nextEvent,
  seasonLength,
  historyRows,
}: {
  entry: FplEntry
  currentEvent: number
  nextEvent: number
  seasonLength: number
  historyRows: ReturnType<typeof buildHistoryRows>
}): ManagerSummary {
  const previous =
    historyRows.find((row) => row.gameweek === currentEvent - 1)

  return {
    teamId: entry.id,
    name: entry.name,
    currentGameweek: currentEvent,
    nextGameweek: nextEvent,
    seasonLength,
    yearsActive: entry.years_active,
    totalPoints: entry.summary_overall_points,
    eventPoints: entry.summary_event_points,
    previousGameweekPoints: previous?.points ?? 0,
    overallRank: entry.summary_overall_rank,
    eventRank: entry.summary_event_rank,
    // FPL reports the bank and squad value in tenths of a million.
    bank: entry.last_deadline_bank / 10,
    teamValue: entry.last_deadline_value / 10,
    totalTransfers: entry.last_deadline_total_transfers,
    favouriteTeam: entry.favourite_team,
  }
}

export { SQUAD_SLOT_LABELS }
