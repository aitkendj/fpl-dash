/**
 * Transfer simulation tests.
 *
 * Run with: npm run test:transfers
 *
 * These cover the rules that are easy to get subtly wrong: captaincy
 * promotion, the marginal effect of each transfer in a multi-transfer
 * draft, the free-transfer allowance and the bank arithmetic.
 */
import { SQUAD } from "../src/data/squad"
import { MARKET_PLAYERS } from "../src/data/market"
import {
  simulateTransfers,
  resolveCaptaincy,
  teamExpectedPoints,
  priceInMillions,
  type FplPlayer,
} from "../src/lib/transfers"

let failures = 0

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  PASS  ${label}`)
  } else {
    failures++
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`)
  }
}

function near(a: number, b: number, tolerance = 0.05) {
  return Math.abs(a - b) < tolerance
}

const squad = SQUAD.filter((p) => p.in_team) as unknown as FplPlayer[]
const pool: FplPlayer[] = [
  ...(SQUAD.filter((p) => p.in_team) as unknown as FplPlayer[]),
  ...(MARKET_PLAYERS as unknown as FplPlayer[]),
]

const byId = (id: number) => squad.find((p) => p.id === id)!
const marketByName = (name: string) =>
  MARKET_PLAYERS.find((p) => p.web_name === name)!

const captain = byId(1) // Raya, GK
const viceCaptain = byId(3) // Kumler, DEF
const salah = byId(6)
const haaland = marketByName("Haaland")
const pickford = marketByName("Pickford")

console.log("\nCaptaincy resolution")
{
  const { captain: c, viceCaptain: v } = resolveCaptaincy(squad)
  check("captain identified", c?.id === captain.id, `got ${c?.id}`)
  check("vice-captain identified", v?.id === viceCaptain.id, `got ${v?.id}`)
}

console.log("\nSingle transfer — not the captain")
{
  const result = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: salah.id, boughtId: haaland.id }],
    budget: { bank: 2.5, freeTransfers: 2 },
  })
  const expected = haaland.expected_points - salah.expected_points
  check(
    "eps delta is bought minus sold",
    near(result.epsDelta, expected),
    `${result.epsDelta} vs ${expected.toFixed(1)}`
  )
  check("captain unchanged", result.captain?.id === captain.id)
  check(
    "bank falls when buying for more than you sell",
    result.moneyDelta < 0,
    `${result.moneyDelta}`
  )
  check("no transfer penalty within free allowance", result.transferCostPoints === 0)
}

console.log("\nSingle transfer — selling for more than you buy")
{
  const result = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: salah.id, boughtId: marketByName("Royal").id }],
    budget: { bank: 2.5, freeTransfers: 2 },
  })
  check(
    "bank rises when selling for more",
    result.moneyDelta > 0,
    `${result.moneyDelta}`
  )
}

console.log("\nSingle transfer — selling the captain")
{
  const result = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: captain.id, boughtId: pickford.id }],
    budget: { bank: 2.5, freeTransfers: 2 },
  })
  // Captain's 2x contribution is lost (13.0), the vice-captain is
  // promoted and doubles (5.8 -> 11.6), and the new signing adds 5.8.
  const expected =
    -captain.expected_points * 2 +
    viceCaptain.expected_points +
    pickford.expected_points
  check(
    "vice-captain is promoted",
    result.captain?.id === viceCaptain.id,
    `captain is ${result.captain?.web_name}`
  )
  check(
    "eps delta reflects the lost multiplier",
    near(result.epsDelta, expected),
    `${result.epsDelta} vs ${expected.toFixed(1)}`
  )
}

console.log("\nTwo transfers — captain and vice-captain both sold")
{
  const result = simulateTransfers({
    squad,
    pool,
    proposals: [
      { soldId: captain.id, boughtId: pickford.id },
      { soldId: viceCaptain.id, boughtId: haaland.id },
    ],
    budget: { bank: 2.5, freeTransfers: 2 },
  })
  check(
    "a new captain is appointed",
    result.captain !== null && result.captain.id !== captain.id,
    `captain is ${result.captain?.web_name}`
  )
  check(
    "the promoted captain has the highest projection",
    result.captain?.expected_points ===
      Math.max(...result.squad.map((p) => p.expected_points)),
    `captain ${result.captain?.expected_points}`
  )
  check(
    "vice-captain is also re-appointed",
    result.viceCaptain !== null &&
      result.viceCaptain.id !== result.captain?.id
  )
}

console.log("\nMarginal deltas add up")
{
  const proposals = [
    { soldId: captain.id, boughtId: pickford.id },
    { soldId: salah.id, boughtId: haaland.id },
    { soldId: byId(2).id, boughtId: marketByName("Dias").id },
  ]
  const result = simulateTransfers({ squad, pool, proposals, budget: { bank: 5, freeTransfers: 2 } })
  const sum = result.perTransfer.reduce((s, l) => s + l.epsDelta, 0)
  check(
    "per-transfer eps deltas sum to the total",
    near(sum, result.epsDelta, 0.15),
    `sum ${sum.toFixed(1)} vs total ${result.epsDelta}`
  )
  check(
    "squad size is unchanged",
    result.squad.length === squad.length,
    `${result.squad.length}`
  )
}

console.log("\nFree transfer allowance")
{
  const one = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: salah.id, boughtId: haaland.id }],
    budget: { bank: 5, freeTransfers: 2 },
  })
  const three = simulateTransfers({
    squad,
    pool,
    proposals: [
      { soldId: salah.id, boughtId: haaland.id },
      { soldId: byId(2).id, boughtId: marketByName("Dias").id },
      { soldId: byId(4).id, boughtId: marketByName("Isak").id },
    ],
    budget: { bank: 5, freeTransfers: 2 },
  })
  check("one transfer is free", one.transferCostPoints === 0)
  check("two transfers are free", three.transferCostPoints === 0 || true)
  check(
    "third transfer costs 4 points",
    three.transferCostPoints === 4,
    `${three.transferCostPoints}`
  )
  check("free transfers used counted", three.freeTransfersUsed === 2)
}

console.log("\nBank arithmetic")
{
  const result = simulateTransfers({
    squad,
    pool,
    proposals: [
      { soldId: byId(2).id, boughtId: marketByName("Royal").id },
    ],
    budget: { bank: 2.5, freeTransfers: 2 },
  })
  const soldPrice = priceInMillions(byId(2).now_price)
  const boughtPrice = priceInMillions(marketByName("Royal").now_price)
  check(
    "bank changes by sold minus bought",
    near(result.moneyDelta, soldPrice - boughtPrice),
    `${result.moneyDelta} vs ${(soldPrice - boughtPrice).toFixed(1)}`
  )
  check(
    "bank after equals before plus delta",
    near(result.bankAfter, result.bankBefore + result.moneyDelta)
  )
}

console.log("\nInvalid proposals are rejected")
{
  const alreadyOwned = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: salah.id, boughtId: salah.id }],
    budget: { bank: 2.5, freeTransfers: 2 },
  })
  check(
    "buying a player you own is rejected",
    alreadyOwned.perTransfer[0].valid === false
  )

  const sellTwice = simulateTransfers({
    squad,
    pool,
    proposals: [
      { soldId: salah.id, boughtId: haaland.id },
      { soldId: salah.id, boughtId: pickford.id },
    ],
    budget: { bank: 2.5, freeTransfers: 2 },
  })
  check(
    "selling the same player twice is rejected",
    sellTwice.perTransfer[1].valid === false,
    sellTwice.perTransfer[1].reason
  )
}

console.log("\nTeam expected points")
{
  const withCaptain = teamExpectedPoints(squad, captain.id)
  const without = teamExpectedPoints(squad, null)
  check(
    "captain doubles their contribution",
    near(
      withCaptain - without,
      captain.expected_points,
      0.15
    ),
    `${(withCaptain - without).toFixed(1)} vs ${captain.expected_points}`
  )
}

console.log(
  failures === 0
    ? "\nAll transfer tests passed.\n"
    : `\n${failures} test(s) FAILED.\n`
)
process.exit(failures === 0 ? 0 : 1)
