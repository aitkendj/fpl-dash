import "server-only"

import {
  FPL_TEAM_ID,
  getBootstrap,
  getFixtures,
  tryFetchEntry,
  tryFetchHistory,
  tryFetchPicks,
} from "@/lib/server/fpl"
import { getProjections } from "@/lib/server/sidelinequant"
import {
  applyProjections,
  buildElementContext,
  buildHistoryRows,
  buildProjectionLookup,
  buildSquad,
  transformElement,
} from "@/lib/transform"
import type {
  DashboardPlayer,
  DataStatus,
  GameweekHistoryRow,
  ManagerSummary,
  SourceStatus,
  SquadPlayer,
} from "@/lib/model"

/**
 * Assembles the dashboard's data from the external sources.
 *
 * Each source is fetched independently so one failing does not take the
 * whole page down. Failures are recorded and surfaced through `status` —
 * data is never silently substituted or invented.
 */

export interface DashboardSnapshot {
  manager: ManagerSummary | null
  squad: SquadPlayer[]
  players: DashboardPlayer[]
  history: GameweekHistoryRow[]
  /** The gameweek the projections describe. */
  projectionGameweek: number | null
  /** Chips the manager has played this season. */
  chips: { name: string; event: number; time: string }[]
  status: DataStatus
}

/**
 * Load everything the dashboard needs.
 */
export async function loadDashboardSnapshot(
  teamId: number = FPL_TEAM_ID
): Promise<DashboardSnapshot> {
  const sources: SourceStatus[] = []

  /* ---- Official FPL data -------------------------------------------- */
  // The bootstrap is the spine of the dashboard — without it there is
  // nothing to show, so this one is allowed to throw.
  const bootstrap = await getBootstrap()

  const [entryResult, historyResult, fixtures] = await Promise.all([
    tryFetchEntry(teamId),
    tryFetchHistory(teamId),
    getFixtures(),
  ])

  const entry = entryResult.data
  const history = historyResult.data

  const fplErrors = [
    entryResult.error && `manager profile: ${entryResult.error}`,
    historyResult.error && `history: ${historyResult.error}`,

  ].filter(Boolean) as string[]

  const fplSource: SourceStatus = {
    name: "fpl",
    label: "Fantasy Premier League",
    error: fplErrors.length ? fplErrors.join("; ") : null,
    fetchedAt: entryResult.fetchedAt ?? historyResult.fetchedAt,
    official: true,
  }
  sources.push(fplSource)

  /* ---- Gameweeks ---------------------------------------------------- */
  const currentEvent =
    bootstrap.events.find((event) => event.is_current)?.id ??
    entry?.current_event ??
    1

  // The gameweek being projected is the next one that has not started.
  const nextEvent =
    bootstrap.events.find((event) => event.is_next)?.id ?? currentEvent + 1

  /* ---- Sideline Quant ------------------------------------------------ */
  // A failed feed degrades the projections section rather than the page.
  let sqPayload: Awaited<ReturnType<typeof getProjections>> | null = null
  let sqError: string | null = null
  try {
    sqPayload = await getProjections()
  } catch (error) {
    sqError = error instanceof Error ? error.message : "Unknown error"
  }

  sources.push({
    name: "sidelinequant",
    label: "Sideline Quant",
    error: sqError,
    fetchedAt: sqPayload ? new Date() : null,
    official: false,
  })

  /* ---- Players ------------------------------------------------------- */
  const context = buildElementContext(bootstrap, fixtures, nextEvent)

  let players = bootstrap.elements.map((element) =>
    transformElement(element, context)
  )

  if (sqPayload) {
    players = applyProjections(players, buildProjectionLookup(sqPayload))
  }

  /* ---- Squad --------------------------------------------------------- */
  let squad: SquadPlayer[] = []
  if (entry) {
    const picksResult = await tryFetchPicks(currentEvent, teamId)
    if (picksResult.data) {
      squad = buildSquad(players, picksResult.data)
    } else {
      fplSource.error = [
        fplSource.error,
        `picks: ${picksResult.error}`,
      ]
        .filter(Boolean)
        .join("; ")
    }
  }

  /* ---- Manager summary ------------------------------------------------ */
  const manager: ManagerSummary | null = entry
    ? {
        teamId: entry.id,
        name: entry.name,
        currentGameweek: currentEvent,
        nextGameweek: nextEvent,
        seasonLength: bootstrap.events.length,
        yearsActive: entry.years_active,
        totalPoints: entry.summary_overall_points,
        eventPoints: entry.summary_event_points,
        overallRank: entry.summary_overall_rank,
        eventRank: entry.summary_event_rank,
        bank: entry.last_deadline_bank,
        teamValue: entry.last_deadline_value,
        totalTransfers: entry.last_deadline_total_transfers,
        favouriteTeam: entry.favourite_team,
      }
    : null

  const historyRows = history ? buildHistoryRows(history) : []

  return {
    manager,
    squad,
    players,
    history: historyRows,
    projectionGameweek: sqPayload?.gameweek ?? null,
    chips: history?.chips ?? [],
    status: {
      sources,
      complete: sources.every((source) => !source.error),
      degraded: sources.some((source) => !!source.error),
    },
  }
}
