import type { FPLPosition } from "@/data/squad"

/**
 * Transfer simulation.
 *
 * A single authoritative implementation of "what happens to my team if
 * I make these transfers". Staged transfers compose: the squad, the
 * captaincy, the bank balance and the expected-points total are all
 * recomputed from the full set of proposals, so the marginal effect of
 * each line adds up to the headline number.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** The minimum shape a player needs for transfer maths. */
export interface FplPlayer {
  id: number
  web_name: string
  position: FPLPosition
  team: number
  /** FPL native: tenths of £m */
  now_price: number
  expected_points: number
  is_captain: boolean
  is_vice_captain: boolean
}

export interface TransferProposal {
  soldId: number
  boughtId: number
}

export interface TransferBudget {
  /** Money in the bank, in £m */
  bank: number
  /** Transfers that can be made without a points penalty */
  freeTransfers: number
}

export interface PerTransferImpact {
  soldId: number
  boughtId: number
  soldName: string
  boughtName: string
  soldPrice: number
  boughtPrice: number
  /** Marginal expected-points change this transfer contributes */
  epsDelta: number
  /** Money returned to the bank by this transfer */
  moneyDelta: number
  valid: boolean
  reason?: string
}

export interface TransferImpact {
  /** Final squad after every proposal is applied */
  squad: FplPlayer[]
  captain: FplPlayer | null
  viceCaptain: FplPlayer | null

  teamEpsBefore: number
  teamEpsAfter: number
  /** Signed change in team expected points (excluding transfer penalties) */
  epsDelta: number

  bankBefore: number
  bankAfter: number
  /** Signed change in the bank */
  moneyDelta: number

  /** Points lost to the transfer penalty */
  transferCostPoints: number
  freeTransfersUsed: number

  perTransfer: PerTransferImpact[]
  warnings: string[]
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/** FPL charges 4 points for each transfer beyond the free allowance. */
export const TRANSFER_COST_POINTS = 4

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function priceInMillions(nowPrice: number): number {
  return nowPrice / 10
}

export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Total expected points for a squad, applying the captain's 2x
 * multiplier to whoever holds the armband.
 */
export function teamExpectedPoints(
  squad: Pick<FplPlayer, "id" | "expected_points">[],
  captainId?: number | null
): number {
  return round(
    squad.reduce((sum, player) => {
      const multiplier = captainId != null && player.id === captainId ? 2 : 1
      return sum + (player.expected_points ?? 0) * multiplier
    }, 0)
  )
}

/**
 * Decide who wears the armband after a set of transfers.
 *
 * If the captain is still in the squad they keep it. If they have been
 * sold the vice-captain is promoted, as the FPL does automatically. If
 * the vice-captain has gone too, the highest-projected player steps up.
 */
export function resolveCaptaincy(squad: FplPlayer[]): {
  captain: FplPlayer | null
  viceCaptain: FplPlayer | null
} {
  if (squad.length === 0) return { captain: null, viceCaptain: null }

  const currentCaptain = squad.find((p) => p.is_captain)
  const currentVice = squad.find((p) => p.is_vice_captain)

  let captain = currentCaptain ?? null
  let viceCaptain = currentVice ?? null

  // Captain sold — promote the vice-captain if they survived
  if (!captain) {
    captain = viceCaptain ?? null
    viceCaptain = null
  }

  // Still no captain — the best remaining player steps up
  if (!captain) {
    captain = [...squad].sort((a, b) => b.expected_points - a.expected_points)[0]
  }

  // Vice-captain sold — promote the next best
  if (!viceCaptain || !squad.some((p) => p.id === viceCaptain?.id)) {
    viceCaptain =
      [...squad]
        .filter((p) => p.id !== captain?.id)
        .sort((a, b) => b.expected_points - a.expected_points)[0] ?? null
  }

  return { captain, viceCaptain }
}

/* ------------------------------------------------------------------ */
/* Simulation                                                          */
/* ------------------------------------------------------------------ */

interface SimulateInput {
  squad: FplPlayer[]
  /** Every player that could be bought (squad included) */
  pool: FplPlayer[]
  proposals: TransferProposal[]
  budget: TransferBudget
}

/**
 * Apply a list of transfer proposals to a squad and report the full
 * downstream effect.
 */
export function simulateTransfers({
  squad,
  pool,
  proposals,
  budget,
}: SimulateInput): TransferImpact {
  const warnings: string[] = []
  const perTransfer: PerTransferImpact[] = []

  const initialCaptaincy = resolveCaptaincy(squad)
  const teamEpsBefore = teamExpectedPoints(squad, initialCaptaincy.captain?.id)
  const bankBefore = budget.bank

  // ---- Apply the transfers -------------------------------------------
  let workingSquad = [...squad]
  let bank = budget.bank
  let moneyDelta = 0

  for (const proposal of proposals) {
    const sold = workingSquad.find((p) => p.id === proposal.soldId)
    const bought = pool.find((p) => p.id === proposal.boughtId)

    if (!sold) {
      perTransfer.push({
        soldId: proposal.soldId,
        boughtId: proposal.boughtId,
        soldName: "—",
        boughtName: pool.find((p) => p.id === proposal.boughtId)?.web_name ?? "—",
        soldPrice: 0,
        boughtPrice: 0,
        epsDelta: 0,
        moneyDelta: 0,
        valid: false,
        reason: "That player is no longer in the squad.",
      })
      continue
    }

    if (!bought) {
      perTransfer.push({
        soldId: proposal.soldId,
        boughtId: proposal.boughtId,
        soldName: sold.web_name,
        boughtName: "—",
        soldPrice: priceInMillions(sold.now_price),
        boughtPrice: 0,
        epsDelta: 0,
        moneyDelta: 0,
        valid: false,
        reason: "That replacement player is unavailable.",
      })
      continue
    }

    if (workingSquad.some((p) => p.id === bought.id)) {
      perTransfer.push({
        soldId: proposal.soldId,
        boughtId: proposal.boughtId,
        soldName: sold.web_name,
        boughtName: bought.web_name,
        soldPrice: priceInMillions(sold.now_price),
        boughtPrice: priceInMillions(bought.now_price),
        epsDelta: 0,
        moneyDelta: 0,
        valid: false,
        reason: `You already own ${bought.web_name}.`,
      })
      continue
    }

    // Remove the sold player, add the replacement
    workingSquad = workingSquad.filter((p) => p.id !== sold.id)
    workingSquad.push({
      ...bought,
      is_captain: false,
      is_vice_captain: false,
    })

    const delta =
      priceInMillions(sold.now_price) - priceInMillions(bought.now_price)
    bank += delta
    moneyDelta += delta

    perTransfer.push({
      soldId: sold.id,
      boughtId: bought.id,
      soldName: sold.web_name,
      boughtName: bought.web_name,
      soldPrice: priceInMillions(sold.now_price),
      boughtPrice: priceInMillions(bought.now_price),
      epsDelta: 0, // filled in below
      moneyDelta: round(delta),
      valid: true,
    })
  }

  const captaincy = resolveCaptaincy(workingSquad)
  const teamEpsAfter = teamExpectedPoints(workingSquad, captaincy.captain?.id)

  // ---- Marginal EPS contribution of each valid transfer ---------------
  // Each line is measured as the difference between simulating the full
  // set and simulating the set without that line, so the parts sum to
  // the whole.
  for (let i = 0; i < perTransfer.length; i++) {
    const line = perTransfer[i]
    if (!line.valid) continue

    const without = proposals.filter((_, index) => index !== i)
    const counterfactual = simulateTransfers({
      squad,
      pool,
      proposals: without,
      budget,
    })
    line.epsDelta = round(teamEpsAfter - counterfactual.teamEpsAfter)
  }

  const epsDelta = round(teamEpsAfter - teamEpsBefore)

  // ---- Transfer penalty and free allowance ---------------------------
  const validCount = perTransfer.filter((line) => line.valid).length
  const freeTransfersUsed = Math.min(validCount, budget.freeTransfers)
  const chargeable = Math.max(0, validCount - budget.freeTransfers)
  const transferCostPoints = chargeable * TRANSFER_COST_POINTS

  if (chargeable > 0) {
    warnings.push(
      `${chargeable} transfer${
        chargeable === 1 ? "" : "s"
      } beyond your free allowance will cost ${transferCostPoints} points.`
    )
  }

  if (bank < 0) {
    warnings.push(
      `You are £${Math.abs(round(bank)).toFixed(1)}m short of covering these transfers.`
    )
  }

  // ---- Suggest a captain if the incoming player is the better option ---
  const incoming = proposals
    .map((p) => pool.find((x) => x.id === p.boughtId))
    .filter((p): p is FplPlayer => !!p)
  const bestIncoming = [...incoming].sort(
    (a, b) => b.expected_points - a.expected_points
  )[0]

  if (
    bestIncoming &&
    captaincy.captain &&
    bestIncoming.expected_points > captaincy.captain.expected_points
  ) {
    warnings.push(
      `Consider making ${bestIncoming.web_name} captain — ${bestIncoming.expected_points.toFixed(
        1
      )} projected points against ${captaincy.captain.web_name}'s ${captaincy.captain.expected_points.toFixed(
        1
      )}.`
    )
  }

  return {
    squad: workingSquad,
    captain: captaincy.captain,
    viceCaptain: captaincy.viceCaptain,
    teamEpsBefore,
    teamEpsAfter,
    epsDelta,
    bankBefore,
    bankAfter: round(bank),
    moneyDelta: round(moneyDelta),
    transferCostPoints,
    freeTransfersUsed,
    perTransfer,
    warnings,
  }
}
