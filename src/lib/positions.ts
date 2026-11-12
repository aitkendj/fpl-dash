import type { FPLPosition } from "@/lib/model"

/**
 * Position metadata shared across the dashboard.
 */

export const POSITION_ORDER: FPLPosition[] = ["GK", "DEF", "MID", "FWD"]

export const POSITION_LABEL: Record<FPLPosition, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
}

export const POSITION_SHORT: Record<FPLPosition, string> = {
  GK: "GK",
  DEF: "DEF",
  MID: "MID",
  FWD: "FWD",
}

/** The slot a player occupies in the squad list, 1-11 then the bench. */
export const SQUAD_SLOT_LABELS: Record<number, string> = {
  1: "GK",
  2: "DEF",
  3: "DEF",
  4: "DEF",
  5: "MID",
  6: "MID",
  7: "MID",
  8: "MID",
  9: "FWD",
  10: "FWD",
  11: "FWD",
  12: "Sub",
  13: "Sub",
  14: "Sub",
  15: "Sub",
}
