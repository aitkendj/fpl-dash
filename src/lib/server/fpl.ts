import "server-only"

import { fetchJson, tryFetchJson, type FetchResult } from "./http"
import type {
  FplBootstrap,
  FplEntry,
  FplFixture,
  FplHistory,
  FplPicks,
} from "./types"

/**
 * Client for the official Fantasy Premier League API.
 *
 * https://fantasy.premierleague.com/api/
 *
 * No credentials are used or stored — every endpoint below is public.
 */

export const FPL_API_BASE = "https://fantasy.premierleague.com/api"

/** The manager this dashboard belongs to. */
export const FPL_TEAM_ID = 6906082

/**
 * Cache policy, in seconds.
 *
 * Bootstrap data changes a handful of times a day. Manager data changes
 * on every deadline, so it is refreshed much more eagerly.
 */
export const CACHE = {
  bootstrap: 60 * 60 * 6, // 6 hours
  fixtures: 60 * 60 * 6, // 6 hours
  entry: 60 * 5, // 5 minutes
  history: 60 * 5, // 5 minutes
  picks: 60 * 5, // 5 minutes
} as const

/**
 * Bootstrap data: players, clubs, gameweeks and position rules.
 *
 * Note the trailing slash — the API returns 404 without it.
 */
export function fetchBootstrap(): Promise<FplBootstrap> {
  return fetchJson<FplBootstrap>(`${FPL_API_BASE}/bootstrap-static/`, {
    revalidate: CACHE.bootstrap,
  })
}

/** Fixtures for the season. */
export function fetchFixtures(): Promise<FplFixture[]> {
  return fetchJson<FplFixture[]>(`${FPL_API_BASE}/fixtures/`, {
    revalidate: CACHE.fixtures,
  })
}

/** The manager's profile and headline summary figures. */
export function fetchEntry(teamId = FPL_TEAM_ID): Promise<FplEntry> {
  return fetchJson<FplEntry>(`${FPL_API_BASE}/entry/${teamId}/`, {
    revalidate: CACHE.entry,
  })
}

/** Per-gameweek history for the manager, plus previous seasons. */
export function fetchHistory(teamId = FPL_TEAM_ID): Promise<FplHistory> {
  return fetchJson<FplHistory>(`${FPL_API_BASE}/entry/${teamId}/history/`, {
    revalidate: CACHE.history,
  })
}

/** The manager's picks for a given gameweek. */
export function fetchPicks(
  gameweek: number,
  teamId = FPL_TEAM_ID
): Promise<FplPicks> {
  return fetchJson<FplPicks>(
    `${FPL_API_BASE}/entry/${teamId}/event/${gameweek}/picks/`,
    { revalidate: CACHE.picks }
  )
}

/* ------------------------------------------------------------------ */
/* Fallible variants                                                   */
/* ------------------------------------------------------------------ */

/**
 * These return a result object rather than throwing, so one failing
 * endpoint degrades a single section rather than the whole dashboard.
 */

export function tryFetchFixtures(): Promise<FetchResult<FplFixture[]>> {
  return tryFetchJson<FplFixture[]>(`${FPL_API_BASE}/fixtures/`, {
    revalidate: CACHE.fixtures,
  })
}

export function tryFetchEntry(
  teamId = FPL_TEAM_ID
): Promise<FetchResult<FplEntry>> {
  return tryFetchJson<FplEntry>(`${FPL_API_BASE}/entry/${teamId}/`, {
    revalidate: CACHE.entry,
  })
}

export function tryFetchHistory(
  teamId = FPL_TEAM_ID
): Promise<FetchResult<FplHistory>> {
  return tryFetchJson<FplHistory>(`${FPL_API_BASE}/entry/${teamId}/history/`, {
    revalidate: CACHE.history,
  })
}

export function tryFetchPicks(
  gameweek: number,
  teamId = FPL_TEAM_ID
): Promise<FetchResult<FplPicks>> {
  return tryFetchJson<FplPicks>(
    `${FPL_API_BASE}/entry/${teamId}/event/${gameweek}/picks/`,
    { revalidate: CACHE.picks }
  )
}
