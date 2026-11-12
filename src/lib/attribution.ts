/**
 * Attribution for external data sources.
 *
 * Kept separate from the server-only clients so client components can
 * reference it without pulling server code into the browser bundle.
 */

export const SQ_ATTRIBUTION = {
  name: "Sideline Quant",
  url: "https://sidelinequant.com",
  licence: "CC BY 4.0",
  licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
} as const

export const FPL_ATTRIBUTION = {
  name: "Fantasy Premier League",
  url: "https://fantasy.premierleague.com",
} as const
