import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge conditional class names, resolving Tailwind conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with thousands separators.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value)
}

/**
 * Format an FPL price (stored in tenths of millions) as a currency string.
 * 500 -> "£5.0m"
 */
export function formatPrice(nowPrice: number): string {
  return `£${(nowPrice / 10).toFixed(1)}m`
}

/**
 * Format a signed delta, e.g. +1.8 / -0.4 / 0.0
 */
export function formatDelta(value: number, decimals = 1): string {
  const rounded = Number(value.toFixed(decimals))
  if (rounded === 0) return "0.0"
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(decimals)}`
}

/**
 * Format a gameweek as "GW38" / "Gameweek 38".
 */
export function formatGameweek(gameweek: number): string {
  return `Gameweek ${gameweek}`
}
