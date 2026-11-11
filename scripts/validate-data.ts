/**
 * Data integrity checks.
 *
 * Run with: npx tsx scripts/validate-data.ts
 * (or `npm run validate`)
 *
 * These assertions keep the sample data internally consistent — the same
 * guarantees the live API integration will need to satisfy.
 */
import { SQUAD, PL_TEAM_NAMES, PL_TEAM_ABBREV } from "../src/data/squad"
import { MARKET_PLAYERS } from "../src/data/market"
import { SEASON_GAMEWEEKS, SEASON_SUMMARY } from "../src/data/season"
import { selectStartingEleven } from "../src/lib/formation"

let failures = 0

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  PASS  ${label}`)
  } else {
    failures++
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`)
  }
}

console.log("\nSquad composition")
const starters = SQUAD.filter((p) => p.in_team && !p.is_substitute)
const subs = SQUAD.filter((p) => p.in_team && p.is_substitute)
check("squad has 15 players", SQUAD.filter((p) => p.in_team).length === 15)
check("11 starters", starters.length === 11, `got ${starters.length}`)
check("4 substitutes", subs.length === 4, `got ${subs.length}`)

const byPos = (list: typeof SQUAD) =>
  list.reduce<Record<string, number>>((acc, p) => {
    acc[p.position] = (acc[p.position] ?? 0) + 1
    return acc
  }, {})
const posCounts = byPos(SQUAD.filter((p) => p.in_team))
check(
  "valid FPL composition (2 GK / 5 DEF / 5 MID / 3 FWD)",
  posCounts.GK === 2 && posCounts.DEF === 5 && posCounts.MID === 5 && posCounts.FWD === 3,
  JSON.stringify(posCounts)
)

console.log("\nUnique identifiers")
const allIds = [...SQUAD, ...MARKET_PLAYERS].map((p) => p.id)
check("all player ids unique", new Set(allIds).size === allIds.length)

const squadNames = new Set(SQUAD.filter((p) => p.in_team).map((p) => p.web_name))
const alsoInSquad = MARKET_PLAYERS.filter((p) => squadNames.has(p.web_name))
check(
  "market contains no squad members",
  alsoInSquad.length === 0,
  alsoInSquad.map((p) => p.web_name).join(", ")
)

console.log("\nClub references")
const allTeams = [...SQUAD, ...MARKET_PLAYERS].flatMap((p) => [
  p.team,
  p.opposition ?? 0,
])
const unknownTeams = allTeams.filter(
  (t) => t !== 0 && !PL_TEAM_NAMES[t]
)
check(
  "every club id resolves to a club",
  unknownTeams.length === 0,
  `unknown: ${[...new Set(unknownTeams)].join(", ")}`
)
check(
  "every club id has an abbreviation",
  allTeams.every((t) => t === 0 || !!PL_TEAM_ABBREV[t])
)

const selfFixtures = [...SQUAD, ...MARKET_PLAYERS].filter(
  (p) => p.opposition !== undefined && p.opposition === p.team
)
check("no player faces their own club", selfFixtures.length === 0)

console.log("\nClub assignments")
// Spot-check the clubs these players actually play for. This catches
// club ids that are valid but assigned to the wrong player.
const EXPECTED_CLUBS: Record<string, number> = {
  Raya: 12, // Liverpool
  Salah: 12, // Liverpool
  Saliba: 12, // Liverpool
  TAA: 12, // Liverpool
  Haaland: 13, // Manchester City
  Saka: 1, // Arsenal
  Son: 1, // Arsenal
  Watkins: 2, // Aston Villa
  Palmer: 6, // Chelsea
  Pickford: 8, // Everton
  Branthwaite: 8, // Everton
  Isak: 15, // Newcastle United
  Paqueta: 19, // West Ham United
}
for (const [name, expectedTeam] of Object.entries(EXPECTED_CLUBS)) {
  const player = [...SQUAD, ...MARKET_PLAYERS].find((p) => p.web_name === name)
  check(
    `${name} plays for ${PL_TEAM_NAMES[expectedTeam]}`,
    player?.team === expectedTeam,
    player ? `got ${PL_TEAM_NAMES[player.team]} (${player.team})` : "player not found"
  )
}

console.log("\nSeason ledger")
const total = SEASON_GAMEWEEKS.reduce((s, gw) => s + gw.points, 0)
check("summary total matches ledger", SEASON_SUMMARY.total_points === total)
check(
  "summary average matches ledger",
  SEASON_SUMMARY.average_points_per_game ===
    Number((total / SEASON_GAMEWEEKS.length).toFixed(1))
)
check(
  "summary rank matches final gameweek",
  SEASON_SUMMARY.overall_rank ===
    SEASON_GAMEWEEKS[SEASON_GAMEWEEKS.length - 1].overall_rank
)
check("38 gameweeks recorded", SEASON_GAMEWEEKS.length === 38)
check(
  "gameweeks are sequential",
  SEASON_GAMEWEEKS.every((gw, i) => gw.gameweek === i + 1)
)

console.log("\nPoints reconciliation")
const playerTotal = SQUAD.filter((p) => p.in_team).reduce(
  (s, p) => s + p.total_points,
  0
)
const captain = SQUAD.find((p) => p.in_team && p.is_captain)
check(
  "player points + captain bonus = season total",
  playerTotal + (captain?.total_points ?? 0) === SEASON_SUMMARY.total_points,
  `${playerTotal} + ${captain?.total_points} != ${SEASON_SUMMARY.total_points}`
)

const xi = selectStartingEleven(
  SQUAD.filter((p) => p.in_team),
  "3-4-3"
)
const bench = SQUAD.filter((p) => p.in_team && p.is_substitute)
// Starting XI points + the captain's extra (doubled) point + any
// substitute who came off the bench.
const gw38 =
  xi.reduce((s, p) => s + p.last_gameweek_points, 0) +
  (captain?.last_gameweek_points ?? 0) +
  bench.reduce((s, p) => s + p.last_gameweek_points, 0)
check(
  "GW38 starters + captain bonus + subs = ledger",
  gw38 === SEASON_SUMMARY.latest_gameweek_points,
  `${gw38} != ${SEASON_SUMMARY.latest_gameweek_points}`
)

console.log("\nFormation")
for (const formation of ["3-4-3", "3-5-2", "4-3-3", "4-4-2", "5-3-2"]) {
  const eleven = selectStartingEleven(SQUAD.filter((p) => p.in_team), formation)
  const ids = eleven.map((p) => p.id)
  check(
    `${formation} selects 11 unique players`,
    eleven.length === 11 && new Set(ids).size === 11,
    `${eleven.length} players, ${new Set(ids).size} unique`
  )
}

console.log(
  failures === 0
    ? "\nAll data checks passed.\n"
    : `\n${failures} check(s) FAILED.\n`
)
process.exit(failures === 0 ? 0 : 1)
