import "server-only"

import {
  SNAPSHOT_CAPTURED_AT,
  SNAPSHOT_CHIPS,
  SNAPSHOT_HISTORY,
  SNAPSHOT_MANAGER,
  SNAPSHOT_PLAYERS,
  SNAPSHOT_SQUAD,
} from "@/data/snapshot"
import type {
  DashboardPlayer,
  DataStatus,
  GameweekHistoryRow,
  ManagerSummary,
  SourceStatus,
  SquadPlayer,
} from "@/lib/model"

/**
 * The data the dashboard renders from.
 *
 * Every page reads this rather than importing sample data directly, so
 * the live path and the offline fallback are interchangeable.
 */

export interface DashboardSnapshot {
  manager: ManagerSummary | null
  squad: SquadPlayer[]
  players: DashboardPlayer[]
  history: GameweekHistoryRow[]
  /** The gameweek the projections describe. */
  projectionGameweek: number | null
  chips: { name: string; event: number; time: string }[]
  status: DataStatus
  /**
   * "live" — retrieved from the external APIs.
   * "snapshot" — the captured fallback, because a source was unavailable.
   */
  origin: "live" | "snapshot"
  /** When the data was captured or retrieved. */
  retrievedAt: string
}

export { SNAPSHOT_CAPTURED_AT }

/**
 * The captured snapshot, used when the live sources are unreachable.
 */
export function getSnapshotData(): Omit<DashboardSnapshot, "status"> {
  return {
    manager: SNAPSHOT_MANAGER,
    squad: SNAPSHOT_SQUAD,
    players: SNAPSHOT_PLAYERS,
    history: SNAPSHOT_HISTORY,
    projectionGameweek: SNAPSHOT_MANAGER.nextGameweek,
    chips: SNAPSHOT_CHIPS,
    origin: "snapshot",
    retrievedAt: SNAPSHOT_CAPTURED_AT,
  }
}

/**
 * Build the status object for the snapshot fallback.
 */
export function getSnapshotStatus(
  errors: string[] = []
): DataStatus {
  const sources: SourceStatus[] = [
    {
      name: "fpl",
      label: "Fantasy Premier League",
      error: errors.length ? errors.join("; ") : null,
      fetchedAt: new Date(SNAPSHOT_CAPTURED_AT),
      official: true,
    },
    {
      name: "sidelinequant",
      label: "Sideline Quant",
      error: null,
      fetchedAt: new Date(SNAPSHOT_CAPTURED_AT),
      official: false,
    },
  ]

  return {
    sources,
    complete: errors.length === 0,
    degraded: errors.length > 0,
  }
}
