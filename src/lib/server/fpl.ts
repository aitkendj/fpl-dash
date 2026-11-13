import "server-only"

import { cacheLife } from "next/cache"
import { fetchJson, tryFetchJson, type FetchResult } from "./http"
import {
  reduceBootstrap,
  reduceFixtures,
  type ReducedBootstrap,
  type ReducedFixture,
} from "./reduce"
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
 *
 * Important: an error thrown inside a `"use cache"` function cannot be
 * caught by its caller, so every cached accessor below catches its own
 * failures and returns a result object instead. Failures are cached
 * briefly so a transient outage is retried quickly, while successes are
 * cached for hours.
 */

export const FPL_API_BASE =
  process.env.FPL_API_BASE ?? "https://fantasy.premierleague.com/api"

/** The manager this dashboard belongs to. */
export const FPL_TEAM_ID = 6906082

/**
 * Cache policy, in seconds.
 */
export const CACHE = {
  bootstrap: 60 * 60 * 6, // 6 hours
  fixtures: 60 * 60 * 6, // 6 hours
  entry: 60 * 5, // 5 minutes
  history: 60 * 5, // 5 minutes
  picks: 60 * 5, // 5 minutes
  /** How long a failure is held before being retried. */
  retry: 60,
} as const

/**
 * The result of a cached fetch. `data` is null when the fetch failed.
 */
export interface CachedResult<T> {
  data: T | null
  error: string | null
}

/* ------------------------------------------------------------------ */
/* Bootstrap                                                           */
/* ------------------------------------------------------------------ */

/**
 * Fetch the raw bootstrap response without caching.
 */
export function fetchBootstrapRaw(): Promise<FplBootstrap> {
  return fetchJson<FplBootstrap>(`${FPL_API_BASE}/bootstrap-static/`, {
    revalidate: 0,
    timeout: 15_000,
  })
}

/**
 * Bootstrap data: players, clubs, gameweeks and position rules.
 *
 * Note the trailing slash — the API returns 404 without it.
 */
export async function getBootstrap(): Promise<CachedResult<ReducedBootstrap>> {
  "use cache"

  let data: ReducedBootstrap | null = null
  let error: string | null = null

  try {
    data = reduceBootstrap(await fetchBootstrapRaw())
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error"
  }

  cacheLife({ revalidate: error ? CACHE.retry : CACHE.bootstrap })
  return { data, error }
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

/** Fetch the raw fixtures response without caching. */
export function fetchFixturesRaw(): Promise<FplFixture[]> {
  return fetchJson<FplFixture[]>(`${FPL_API_BASE}/fixtures/`, {
    revalidate: 0,
    timeout: 15_000,
  })
}

export async function getFixtures(): Promise<CachedResult<ReducedFixture[]>> {
  "use cache"

  let data: ReducedFixture[] | null = null
  let error: string | null = null

  try {
    data = reduceFixtures(await fetchFixturesRaw())
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error"
  }

  cacheLife({ revalidate: error ? CACHE.retry : CACHE.fixtures })
  return { data, error }
}

/* ------------------------------------------------------------------ */
/* Manager data                                                        */
/* ------------------------------------------------------------------ */

/**
 * The manager's profile and headline summary figures.
 */
export function fetchEntry(teamId = FPL_TEAM_ID): Promise<FplEntry> {
  return fetchJson<FplEntry>(`${FPL_API_BASE}/entry/${teamId}/`, {
    revalidate: CACHE.entry,
  })
}

/**
 * Per-gameweek history for the manager, plus previous seasons.
 */
export function fetchHistory(teamId = FPL_TEAM_ID): Promise<FplHistory> {
  return fetchJson<FplHistory>(`${FPL_API_BASE}/entry/${teamId}/history/`, {
    revalidate: CACHE.history,
  })
}

/**
 * The manager's picks for a given gameweek.
 */
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
    revalidate: 0,
    timeout: 15_000,
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
