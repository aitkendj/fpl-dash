import "server-only"

import { cacheLife } from "next/cache"

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
  getSnapshotData,
  getSnapshotStatus,
  type DashboardSnapshot,
} from "@/data/provider"
import {
  applyProjections,
  buildElementContext,
  buildHistoryRows,
  buildManagerSummary,
  buildProjectionLookup,
  buildSquad,
  transformElement,
} from "@/lib/transform"
import type {
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
 *
 * If the live sources cannot be reached at all, the captured snapshot
 * is used instead and `origin` is set to "snapshot" so the interface
 * can say so plainly.
 */

export type { DashboardSnapshot }

/**
 * Load everything the dashboard needs.
 */
/**
 * Loads everything the dashboard needs.
 *
 * Cached for five minutes. The expensive upstream fetches inside are
 * cached for longer, so a revalidation only re-reads the manager's
 * figures — which change on every deadline.
 */
export async function loadDashboardSnapshot(
  teamId: number = FPL_TEAM_ID
): Promise<DashboardSnapshot> {
  "use cache"
  cacheLife({ revalidate: 60 * 5, stale: 60 * 30 })
  const sources: SourceStatus[] = []

  /* ---- Official FPL data -------------------------------------------- */
  // The bootstrap is the spine of the dashboard — without it there is
  // nothing to show, so this one is allowed to throw.
  let bootstrap: Awaited<ReturnType<typeof getBootstrap>>
  try {
    bootstrap = await getBootstrap()
  } catch (error) {
    // The live sources are unreachable — fall back to the captured
    // snapshot and say so plainly rather than showing invented data.
    const message = error instanceof Error ? error.message : "Unknown error"
    return {
      ...getSnapshotData(),
      status: getSnapshotStatus([`live data unavailable: ${message}`]),
    }
  }

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
  const historyRows = history ? buildHistoryRows(history) : []

  const manager: ManagerSummary | null = entry
    ? buildManagerSummary({
        entry,
        currentEvent,
        nextEvent,
        seasonLength: bootstrap.events.length,
        historyRows,
      })
    : null

  return {
    manager,
    squad,
    players,
    history: historyRows,
    projectionGameweek: sqPayload?.gameweek ?? null,
    chips: history?.chips ?? [],
    origin: "live",
    retrievedAt: new Date().toISOString(),
    status: {
      sources,
      complete: sources.every((source) => !source.error),
      degraded: sources.some((source) => !!source.error),
    },
  }
}
