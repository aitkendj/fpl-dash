import "server-only"

import { fetchJson, tryFetchJson, type FetchResult } from "./http"
import type { SqPayload } from "./types"

/**
 * Client for the Sideline Quant public projections feed.
 *
 * https://sidelinequant.com/data/latest.json
 *
 * Licensed CC BY 4.0 — attribution to Sideline Quant is required
 * wherever the projections are displayed.
 */

export const SQ_ENDPOINT = "https://sidelinequant.com/data/latest.json"

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

/**
 * Fetch the latest projections.
 *
 * `latest.json` redirects to the current gameweek's own address. The
 * redirect is followed transparently.
 */
export async function fetchProjections(): Promise<SqPayload> {
  const payload = await fetchJson<SqPayload>(SQ_ENDPOINT, {
    revalidate: SQ_CACHE_SECONDS,
    timeout: 20_000,
  })

  if (!Array.isArray(payload.rows)) {
    throw new Error(
      "Sideline Quant payload did not contain a rows array — the feed shape may have changed."
    )
  }

  return payload
}

/**
 * Fallible variant — returns a result object instead of throwing so a
 * failed feed degrades the projections section rather than the page.
 */
export function tryFetchProjections(): Promise<FetchResult<SqPayload>> {
  return tryFetchJson<SqPayload>(SQ_ENDPOINT, {
    revalidate: SQ_CACHE_SECONDS,
    timeout: 20_000,
  })
}
