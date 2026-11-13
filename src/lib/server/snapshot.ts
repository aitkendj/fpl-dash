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
 *
 * This function must never throw: a failure here would fail the
 * production build, which runs the same code during prerendering.
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

  try {
    /* ---- Official FPL data ------------------------------------------ */
    const [bootstrapResult, fixturesResult, entryResult, historyResult] =
      await Promise.all([
        getBootstrap(),
        getFixtures(),
        tryFetchEntry(teamId),
        tryFetchHistory(teamId),
      ])

    const bootstrap = bootstrapResult.data

    if (!bootstrap) {
      // The spine of the dashboard is unreachable — fall back to the
      // captured snapshot rather than rendering an empty page.
      return {
        ...getSnapshotData(),
        status: getSnapshotStatus([
          `live data unavailable: ${bootstrapResult.error ?? "unknown error"}`,
        ]),
      }
    }

    const entry = entryResult.data
    const history = historyResult.data
    const fixtures = fixturesResult.data ?? []

    const fplErrors = [
      bootstrapResult.error && `bootstrap: ${bootstrapResult.error}`,
      fixturesResult.error && `fixtures: ${fixturesResult.error}`,
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

    /* ---- Gameweeks -------------------------------------------------- */
    const currentEvent =
      bootstrap.events.find((event) => event.is_current)?.id ??
      entry?.current_event ??
      1

    // The gameweek being projected is the next one that has not started.
    const nextEvent =
      bootstrap.events.find((event) => event.is_next)?.id ?? currentEvent + 1

    /* ---- Sideline Quant ---------------------------------------------- */
    const sqResult = await getProjections()
    sources.push({
      name: "sidelinequant",
      label: "Sideline Quant",
      error: sqResult.error,
      fetchedAt: sqResult.data ? new Date() : null,
      official: false,
    })

    /* ---- Players ---------------------------------------------------- */
    const context = buildElementContext(bootstrap, fixtures, nextEvent)

    let players = bootstrap.elements.map((element) =>
      transformElement(element, context)
    )

    if (sqResult.data) {
      players = applyProjections(
        players,
        buildProjectionLookup(sqResult.data)
      )
    }

    /* ---- Squad -------------------------------------------------------- */
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
      projectionGameweek: sqResult.data?.gameweek ?? null,
      chips: history?.chips ?? [],
      origin: "live",
      retrievedAt: new Date().toISOString(),
      status: {
        sources,
        complete: sources.every((source) => !source.error),
        degraded: sources.some((source) => !!source.error),
      },
    }
  } catch (error) {
    // Last line of defence. A build must never fail because an upstream
    // service is briefly unavailable.
    const message = error instanceof Error ? error.message : "Unknown error"
    return {
      ...getSnapshotData(),
      status: getSnapshotStatus([`live data unavailable: ${message}`]),
    }
  }
}
