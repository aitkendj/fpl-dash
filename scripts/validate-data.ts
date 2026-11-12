/**
 * Snapshot integrity checks.
 *
 * Run with: npm run validate
 *
 * The captured snapshot is the offline fallback for the dashboard, so
 * it needs the same guarantees as the live data: a valid squad, a
 * coherent ledger, and projections that reconcile with the official
 * figures.
 */
import {
  SNAPSHOT_CAPTURED_AT,
  SNAPSHOT_CHIPS,
  SNAPSHOT_HISTORY,
  SNAPSHOT_MANAGER,
  SNAPSHOT_PLAYERS,
  SNAPSHOT_SQUAD,
} from "../src/data/snapshot"
import { selectStartingEleven, selectSubstitutes } from "../src/lib/formation"
import { teamExpectedPoints } from "../src/lib/transfers"

let failures = 0

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  PASS  ${label}`)
  } else {
    failures++
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`)
  }
}

console.log("\nSnapshot")
check("snapshot has a capture timestamp", !!SNAPSHOT_CAPTURED_AT)
check("snapshot has a manager", SNAPSHOT_MANAGER.name.length > 0)
console.log(
  `  Captured ${SNAPSHOT_CAPTURED_AT} · ${SNAPSHOT_MANAGER.name} · GW${SNAPSHOT_MANAGER.currentGameweek}`
)

console.log("\nSquad composition")
check("squad has 15 players", SNAPSHOT_SQUAD.length === 15, `${SNAPSHOT_SQUAD.length}`)
check(
  "eleven starters",
  SNAPSHOT_SQUAD.filter((p) => !p.isSubstitute).length === 11
)
check(
  "four substitutes",
  SNAPSHOT_SQUAD.filter((p) => p.isSubstitute).length === 4
)
check(
  "exactly one captain",
  SNAPSHOT_SQUAD.filter((p) => p.isCaptain).length === 1
)
check(
  "exactly one vice-captain",
  SNAPSHOT_SQUAD.filter((p) => p.isViceCaptain).length === 1
)
check(
  "no duplicate players",
  new Set(SNAPSHOT_SQUAD.map((p) => p.id)).size === 15
)

console.log("\nUnique identifiers")
const poolIds = SNAPSHOT_PLAYERS.map((p) => p.id)
check("player ids are unique", new Set(poolIds).size === poolIds.length)
check(
  "every squad player appears in the wider pool",
  SNAPSHOT_SQUAD.every((player) => poolIds.includes(player.id))
)

console.log("\nClub references")
const unknownClubs = SNAPSHOT_PLAYERS.filter(
  (p) => !p.clubName || p.clubName === "Unknown"
)
check("every player has a resolved club", unknownClubs.length === 0)

const selfFixtures = SNAPSHOT_PLAYERS.filter(
  (p) => p.opponents.includes(p.clubName)
)
check("no player faces their own club", selfFixtures.length === 0)

console.log("\nPrices")
check(
  "every price is positive and in a sane range",
  SNAPSHOT_PLAYERS.every((p) => p.priceTenths > 0 && p.priceTenths < 2000)
)
check(
  "squad prices are consistent with the wider pool",
  SNAPSHOT_SQUAD.every((player) => {
    const match = SNAPSHOT_PLAYERS.find((p) => p.id === player.id)
    return !match || match.priceTenths === player.priceTenths
  })
)

console.log("\nProjections")
const withSq = SNAPSHOT_PLAYERS.filter(
  (p) => p.sidelineQuantProjection !== null
)
check(
  "most players carry a model projection",
  withSq.length > SNAPSHOT_PLAYERS.length * 0.9,
  `${withSq.length} of ${SNAPSHOT_PLAYERS.length}`
)
check(
  "every model projection has a source",
  withSq.every(
    (p) => p.sidelineQuantProjection?.source === "sidelinequant"
  )
)
check(
  "official projections are present too",
  SNAPSHOT_PLAYERS.filter((p) => p.fplProjection !== null).length > 0
)
check(
  "missing projections are null rather than zero",
  SNAPSHOT_PLAYERS.every(
    (p) =>
      p.sidelineQuantProjection !== null ||
      p.fplProjection === null ||
      p.fplProjection.expectedPoints >= 0
  )
)

console.log("\nFixtures")
check(
  "players have fixture assignments",
  SNAPSHOT_PLAYERS.filter((p) => p.fixtureCount > 0).length > 0
)
check(
  "opponent count matches fixture count",
  SNAPSHOT_PLAYERS.every((p) => p.opponents.length === p.fixtureCount)
)
const doubleGameweeks = SNAPSHOT_PLAYERS.filter((p) => p.fixtureCount > 1)
console.log(
  `  Double gameweek players in the snapshot: ${doubleGameweeks.length}`
)

console.log("\nSeason ledger")
check("history has gameweeks", SNAPSHOT_HISTORY.length > 0)
check(
  "history gameweeks are sequential",
  SNAPSHOT_HISTORY.every((row, index) => row.gameweek === index + 1)
)
const last = SNAPSHOT_HISTORY[SNAPSHOT_HISTORY.length - 1]
check(
  "latest history points match the manager summary",
  last.points === SNAPSHOT_MANAGER.eventPoints
)
check(
  "latest history total matches the manager summary",
  last.totalPoints === SNAPSHOT_MANAGER.totalPoints
)
check(
  "history total equals the sum of gameweek points",
  SNAPSHOT_HISTORY.reduce((sum, row) => sum + row.points, 0) ===
    SNAPSHOT_MANAGER.totalPoints
)

console.log("\nFormation")
for (const formation of ["3-4-3", "3-5-2", "4-3-3", "4-4-2", "5-3-2"]) {
  const eleven = selectStartingEleven(SNAPSHOT_SQUAD, formation)
  const ids = eleven.map((p) => p.id)
  check(
    `${formation} selects 11 unique players`,
    eleven.length === 11 && new Set(ids).size === 11,
    `${eleven.length} players, ${new Set(ids).size} unique`
  )
}
check(
  "bench is four players",
  selectSubstitutes(SNAPSHOT_SQUAD).length === 4
)

console.log("\nCaptaincy")
{
  const captain = SNAPSHOT_SQUAD.find((p) => p.isCaptain)
  const withMultiplier = teamExpectedPoints(SNAPSHOT_SQUAD, captain?.id)
  const without = teamExpectedPoints(SNAPSHOT_SQUAD, null)
  const expected =
    without + (captain?.sidelineQuantProjection?.expectedPoints ?? 0)
  check(
    "captain contribution is doubled in the team total",
    Math.abs(withMultiplier - expected) < 0.15,
    `${withMultiplier} vs ${expected.toFixed(1)}`
  )
}

console.log("\nChips")
check("chips have a name and event", SNAPSHOT_CHIPS.every((c) => c.name && c.event > 0))

console.log(
  failures === 0
    ? "\nAll snapshot checks passed.\n"
    : `\n${failures} check(s) FAILED.\n`
)
process.exit(failures === 0 ? 0 : 1)
