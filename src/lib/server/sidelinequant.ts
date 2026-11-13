import "server-only"

import { cacheLife } from "next/cache"
import { fetchJson, tryFetchJson, type FetchResult } from "./http"
import { reduceSqPayload, type ReducedSqPayload } from "./reduce"
import type { SqPayload } from "./types"
import type { CachedResult } from "./fpl"

/**
 * Client for the Sideline Quant public projections feed.
 *
 * https://sidelinequant.com/data/latest.json
 *
 * Licensed CC BY 4.0 — attribution to Sideline Quant is required
 * wherever the projections are displayed.
 *
 * Like the FPL client, an error inside a `"use cache"` function cannot
 * be caught by its caller, so the cached accessor catches its own
 * failures and returns a result object instead.
 */

export const SQ_ENDPOINT =
  process.env.SQ_ENDPOINT ?? "https://sidelinequant.com/data/latest.json"

export const SQ_ATTRIBUTION = {
  name: "Sideline Quant",
  url: "https://sidelinequant.com",
  licence: "CC BY 4.0",
  licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
} as const

/**
 * Cache policy.
 *
 * The model refreshes a few times a day, and the payload carries an
 * ETag that only changes when a refresh lands. Caching for an hour
 * keeps the dashboard responsive without hammering the feed.
 */
export const SQ_CACHE_SECONDS = 60 * 60

/** How long a failure is held before being retried. */
const SQ_RETRY_SECONDS = 60

/**
 * Fetch the raw projections payload without caching.
 *
 * Kept separate from the cached accessor so the live integration test
 * can exercise the same request path outside the Next.js runtime.
 */
export async function fetchProjectionsRaw(): Promise<SqPayload> {
  const payload = await fetchJson<SqPayload>(SQ_ENDPOINT, {
    revalidate: 0,
    timeout: 15_000,
  })

  if (!Array.isArray(payload.rows)) {
    throw new Error(
      "Sideline Quant payload did not contain a rows array — the feed shape may have changed."
    )
  }

  return payload
}

/**
 * The latest projections, reduced to the columns we use and cached.
 *
 * `latest.json` redirects to the current gameweek's own address. The
 * redirect is followed transparently.
 */
export async function getProjections(): Promise<CachedResult<ReducedSqPayload>> {
  "use cache"

  let data: ReducedSqPayload | null = null
  let error: string | null = null

  try {
    data = reduceSqPayload(await fetchProjectionsRaw())
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error"
  }

  cacheLife({ revalidate: error ? SQ_RETRY_SECONDS : SQ_CACHE_SECONDS })
  return { data, error }
}

/**
 * Fallible variant — returns a result object instead of throwing.
 */
export function tryFetchProjections(): Promise<FetchResult<SqPayload>> {
  return tryFetchJson<SqPayload>(SQ_ENDPOINT, {
    revalidate: 0,
    timeout: 15_000,
  })
}
