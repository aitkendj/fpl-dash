import "server-only"

/**
 * Cached HTTP fetching for external APIs.
 *
 * Every request goes through here so caching policy is consistent and
 * failures are reported rather than silently swallowed.
 */

export type SourceName = "fpl" | "sidelinequant"

export interface FetchResult<T> {
  data: T | null
  /** null when the fetch succeeded */
  error: string | null
  /** When the payload was fetched */
  fetchedAt: Date | null
  /** True when the payload came from the cache rather than the network */
  stale: boolean
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

interface FetchOptions {
  /** Seconds to cache for. 0 disables caching. */
  revalidate: number
  /** Extra headers */
  headers?: Record<string, string>
  /** Timeout in milliseconds */
  timeout?: number
}

/**
 * Fetch JSON with caching and a hard failure mode.
 *
 * Throws `ApiError` on any failure — callers decide whether to fall back.
 */
export async function fetchJson<T>(
  url: string,
  { revalidate, headers, timeout = 15_000 }: FetchOptions
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "fpl-analytics-dashboard/1.0 (personal use)",
        ...headers,
      },
      next: revalidate > 0 ? { revalidate } : undefined,
      cache: revalidate > 0 ? undefined : "no-store",
    })

    if (!response.ok) {
      throw new ApiError(
        `${response.status} ${response.statusText} from ${url}`,
        response.status
      )
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(`Request to ${url} timed out after ${timeout}ms`)
    }
    throw new ApiError(
      `Failed to fetch ${url}: ${error instanceof Error ? error.message : "unknown error"}`
    )
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetch JSON, returning a result object instead of throwing.
 * Used where a failed source should degrade gracefully rather than
 * take the whole page down.
 */
export async function tryFetchJson<T>(
  url: string,
  options: FetchOptions
): Promise<FetchResult<T>> {
  try {
    const data = await fetchJson<T>(url, options)
    return { data, error: null, fetchedAt: new Date(), stale: false }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
      fetchedAt: null,
      stale: false,
    }
  }
}
