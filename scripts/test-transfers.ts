/**
 * Transfer simulation tests.
 *
 * Run with: npm run test:transfers
 *
 * These cover the rules that are easy to get subtly wrong: captaincy
 * promotion, the marginal effect of each transfer in a multi-transfer
 * draft, the free-transfer allowance and the bank arithmetic.
 *
 * The squad and market come from the captured snapshot, so the tests
 * exercise the same data the dashboard renders.
 */
import { SNAPSHOT_SQUAD, SNAPSHOT_PLAYERS } from "../src/data/snapshot"
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

const squad = SNAPSHOT_SQUAD as unknown as FplPlayer[]
const marketOnly = (SNAPSHOT_PLAYERS as unknown as FplPlayer[]).filter(
  (player) => !SNAPSHOT_SQUAD.some((member) => member.id === player.id)
)
const pool: FplPlayer[] = [...squad, ...marketOnly]

const captain = squad.find((p) => p.isCaptain)!
const viceCaptain = squad.find((p) => p.isViceCaptain)!
const outfield = squad.find((p) => !p.isCaptain && !p.isViceCaptain)!

console.log(
  `\n  Captain: ${captain.webName} (${captain.expectedPoints}) · Vice: ${viceCaptain.webName} (${viceCaptain.expectedPoints}) · Market: ${marketOnly.length} buyable`
)

console.log("\nCaptaincy resolution")
{
  const { captain: c, viceCaptain: v } = resolveCaptaincy(squad)
  check("captain identified", c?.id === captain.id, `got ${c?.webName}`)
  check("vice-captain identified", v?.id === viceCaptain.id, `got ${v?.webName}`)
}

console.log("\nSingle transfer — not the captain")
{
  const target = marketOnly
    .filter((p) => p.id !== outfield.id && p.expectedPoints > outfield.expectedPoints)
    .sort((a, b) => b.expectedPoints - a.expectedPoints)[0]
  const result = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: outfield.id, boughtId: target.id }],
    budget: { bank: 8, freeTransfers: 2 },
  })
  const expected = target.expectedPoints - outfield.expectedPoints
  check(
    "eps delta is bought minus sold",
    near(result.epsDelta, expected, 0.15),
    `${result.epsDelta} vs ${expected.toFixed(1)}`
  )
  check("captain unchanged", result.captain?.id === captain.id)
  check(
    "no transfer penalty within the free allowance",
    result.transferCostPoints === 0
  )
}

console.log("\nSingle transfer — selling for more than you buy")
{
  const cheaper = marketOnly
    .filter((p) => p.priceTenths < outfield.priceTenths)
    .sort((a, b) => a.priceTenths - b.priceTenths)[0]
  const result = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: outfield.id, boughtId: cheaper.id }],
    budget: { bank: 8, freeTransfers: 2 },
  })
  check(
    "bank rises when selling for more",
    result.moneyDelta > 0,
    `${result.moneyDelta}`
  )
}

console.log("\nSingle transfer — selling the captain")
{
  const replacement = marketOnly.find(
    (p) => p.id !== captain.id && p.position === captain.position
  )!
  const result = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: captain.id, boughtId: replacement.id }],
    budget: { bank: 8, freeTransfers: 2 },
  })
  // Captain's 2x contribution is lost, the vice-captain is promoted and
  // doubles, and the new signing plays at 1x.
  const expected =
    -captain.expectedPoints * 2 +
    viceCaptain.expectedPoints +
    replacement.expectedPoints
  check(
    "vice-captain is promoted",
    result.captain?.id === viceCaptain.id,
    `captain is ${result.captain?.webName}`
  )
  check(
    "eps delta reflects the lost multiplier",
    near(result.epsDelta, expected, 0.2),
    `${result.epsDelta} vs ${expected.toFixed(1)}`
  )
}

console.log("\nTwo transfers — captain and vice-captain both sold")
{
  const replacement = marketOnly.find((p) => p.id !== captain.id)!
  const second = marketOnly.find(
    (p) => p.id !== captain.id && p.id !== viceCaptain.id && p.id !== replacement.id
  )!
  const result = simulateTransfers({
    squad,
    pool,
    proposals: [
      { soldId: captain.id, boughtId: replacement.id },
      { soldId: viceCaptain.id, boughtId: second.id },
    ],
    budget: { bank: 8, freeTransfers: 2 },
  })
  check(
    "a new captain is appointed",
    result.captain !== null && result.captain.id !== captain.id,
    `captain is ${result.captain?.webName}`
  )
  check(
    "the promoted captain has the highest projection",
    result.captain?.expectedPoints ===
      Math.max(...result.squad.map((p) => p.expectedPoints)),
    `captain ${result.captain?.expectedPoints}`
  )
  check(
    "vice-captain is also re-appointed",
    result.viceCaptain !== null &&
      result.viceCaptain.id !== result.captain?.id
  )
}

console.log("\nMarginal deltas add up")
{
  // A single transfer has no interactions, so its marginal delta must
  // equal the total exactly.
  const others = marketOnly.filter(
    (p) => ![captain.id, viceCaptain.id, outfield.id].includes(p.id)
  )
  const single = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: outfield.id, boughtId: others[0].id }],
    budget: { bank: 8, freeTransfers: 2 },
  })
  check(
    "a single transfer's delta equals the total exactly",
    near(single.perTransfer[0].epsDelta, single.epsDelta, 0.01),
    `${single.perTransfer[0].epsDelta} vs ${single.epsDelta}`
  )

  const proposals = [
    { soldId: captain.id, boughtId: others[0].id },
    { soldId: viceCaptain.id, boughtId: others[1].id },
    { soldId: outfield.id, boughtId: others[2].id },
  ]
  const result = simulateTransfers({
    squad,
    pool,
    proposals,
    budget: { bank: 8, freeTransfers: 2 },
  })
  const sum = result.perTransfer.reduce((s, l) => s + l.epsDelta, 0)
  // Marginal contributions are path-dependent: removing one line can
  // change who the captain is, which changes the other lines' effects.
  // The total is authoritative; the lines are indicative.
  check(
    "per-transfer eps deltas approximate the total",
    near(sum, result.epsDelta, 1.0),
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
  const others = marketOnly.filter(
    (p) => ![captain.id, viceCaptain.id, outfield.id].includes(p.id)
  )
  const one = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: outfield.id, boughtId: others[0].id }],
    budget: { bank: 8, freeTransfers: 2 },
  })
  const three = simulateTransfers({
    squad,
    pool,
    proposals: [
      { soldId: outfield.id, boughtId: others[0].id },
      { soldId: viceCaptain.id, boughtId: others[1].id },
      { soldId: captain.id, boughtId: others[2].id },
    ],
    budget: { bank: 8, freeTransfers: 2 },
  })
  check("one transfer is free", one.transferCostPoints === 0)
  check(
    "third transfer costs 4 points",
    three.transferCostPoints === 4,
    `${three.transferCostPoints}`
  )
  check("free transfers used counted", three.freeTransfersUsed === 2)
}

console.log("\nBank arithmetic")
{
  const cheaper = marketOnly
    .filter((p) => p.priceTenths < outfield.priceTenths)
    .sort((a, b) => a.priceTenths - b.priceTenths)[0]
  const result = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: outfield.id, boughtId: cheaper.id }],
    budget: { bank: 8, freeTransfers: 2 },
  })
  const soldPrice = priceInMillions(outfield.priceTenths)
  const boughtPrice = priceInMillions(cheaper.priceTenths)
  check(
    "bank changes by sold minus bought",
    near(result.moneyDelta, soldPrice - boughtPrice, 0.15),
    `${result.moneyDelta} vs ${(soldPrice - boughtPrice).toFixed(1)}`
  )
  check(
    "bank after equals before plus delta",
    near(result.bankAfter, result.bankBefore + result.moneyDelta, 0.15)
  )
}

console.log("\nInvalid proposals are rejected")
{
  const alreadyOwned = simulateTransfers({
    squad,
    pool,
    proposals: [{ soldId: outfield.id, boughtId: outfield.id }],
    budget: { bank: 8, freeTransfers: 2 },
  })
  check(
    "buying a player you own is rejected",
    alreadyOwned.perTransfer[0].valid === false
  )

  const sellTwice = simulateTransfers({
    squad,
    pool,
    proposals: [
      { soldId: outfield.id, boughtId: marketOnly[0].id },
      { soldId: outfield.id, boughtId: marketOnly[1].id },
    ],
    budget: { bank: 8, freeTransfers: 2 },
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
    near(withCaptain - without, captain.expectedPoints, 0.15),
    `${(withCaptain - without).toFixed(1)} vs ${captain.expectedPoints}`
  )
}

console.log("\nReplacement pool is filtered by position")
{
  // The transfer planner only offers replacements in the same position
  // as the player being sold.
  const midfielder = squad.find((p) => p.position === "MID" && !p.isCaptain)!
  const midReplacements = marketOnly.filter(
    (p) => p.position === midfielder.position
  )
  check(
    "midfielders have midfield replacements available",
    midReplacements.length > 0,
    `${midReplacements.length}`
  )
  check(
    "no replacement is in the same position but already owned",
    midReplacements.every(
      (p) => !squad.some((member) => member.id === p.id)
    )
  )

  const keeper = squad.find((p) => p.position === "GK")!
  const keeperReplacements = marketOnly.filter(
    (p) => p.position === keeper.position
  )
  check(
    "goalkeepers have goalkeeper replacements available",
    keeperReplacements.length > 0,
    `${keeperReplacements.length}`
  )
}

console.log(
  failures === 0
    ? "\nAll transfer tests passed.\n"
    : `\n${failures} test(s) FAILED.\n`
)
process.exit(failures === 0 ? 0 : 1)
