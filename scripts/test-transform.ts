/**
 * Transformation tests.
 *
 * Run with: npm run test:transform
 *
 * These cover the joins between FPL and Sideline Quant, and the
 * double-gameweek aggregation rules, which are easy to get wrong.
 */
import {
  aggregateProjectionRows,
  buildProjectionLookup,
  applyProjections,
  toNumber,
  toNullableNumber,
  toStatus,
  round,
} from "../src/lib/transform"
import type { SqPayload, SqRow } from "../src/lib/server/types"
import type { DashboardPlayer } from "../src/lib/model"

let failures = 0

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  PASS  ${label}`)
  } else {
    failures++
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`)
  }
}

function near(a: number, b: number, tolerance = 0.01) {
  return Math.abs(a - b) < tolerance
}

/* ------------------------------------------------------------------ */
/* Fixtures for a synthetic double gameweek                             */
/* ------------------------------------------------------------------ */

function sqRow(overrides: Partial<SqRow>): SqRow {
  return {
    player_id: 1,
    fixture_id: 100,
    gameweek: 11,
    name: "Test Player",
    web_name: "Test",
    club: "Arsenal",
    position: "MID",
    price_tenths: 80,
    xP: 4,
    sigma: 3,
    p_start: 0.8,
    p_start60: 0.7,
    p_start_sub: 0.1,
    p_cameo: 0.15,
    p_unused: 0.05,
    e_mins: 85,
    gw_sigma: 4.5,
    gw_p10: 1,
    gw_p90: 11,
    horizon_p10: 20,
    horizon_p90: 60,
    horizon_sigma: 12,
    kickoff_time: "2026-11-21T12:30:00Z",
    opponent: "Chelsea",
    was_home: true,
    status: "a",
    form: 3,
    total_points: 40,
    owned_pct: 10,
    p_ge_6: 0.3,
    p_ge_10: 0.1,
    p_goal: 0.2,
    p_assist: 0.2,
    p_cs: 0.2,
    ...overrides,
  }
}

console.log("\nPrimitives")
check("toNumber parses numeric strings", toNumber("6.8") === 6.8)
check("toNumber handles numbers", toNumber(12) === 12)
check("toNumber falls back on junk", toNumber("abc", -1) === -1)
check("toNumber handles null", toNumber(null, 0) === 0)
check("toNullableNumber keeps zero", toNullableNumber("0") === 0)
check("toNullableNumber nulls empty", toNullableNumber("") === null)
check("toStatus maps a/d/i/s", toStatus("a") === "a" && toStatus("i") === "i")
check("toStatus unknown becomes n", toStatus("zzz") === "n")
check("round to one decimal", round(1.26) === 1.3)

console.log("\nSingle fixture aggregation")
{
  const projection = aggregateProjectionRows([
    sqRow({ xP: 4.2, e_mins: 85, p_start: 0.8 }),
  ])
  check("expected points taken from xP", near(projection.expectedPoints, 4.2))
  check("expected minutes taken from e_mins", near(projection.expectedMinutes ?? 0, 85))
  check("start probability is p_start", near(projection.startProbability ?? 0, 0.8))
  check("floor is gw_p10", projection.floor === 1)
  check("ceiling is gw_p90", projection.ceiling === 11)
  check("fixture count is 1", projection.fixtures === 1)
}

console.log("\nDouble gameweek aggregation")
{
  const projection = aggregateProjectionRows([
    sqRow({
      fixture_id: 100,
      xP: 4.2,
      e_mins: 85,
      p_start: 0.8,
      gw_p10: 2,
      gw_p90: 14,
      gw_sigma: 5.1,
    }),
    sqRow({
      fixture_id: 101,
      xP: 3.6,
      e_mins: 72,
      p_start: 0.5,
      gw_p10: 2,
      gw_p90: 14,
      gw_sigma: 5.1,
    }),
  ])

  check("xP is summed across fixtures", near(projection.expectedPoints, 7.8))
  check("expected minutes are summed", near(projection.expectedMinutes ?? 0, 157))
  check("fixture count is 2", projection.fixtures === 2)
  check(
    "start probability is P(start at least once)",
    near(projection.startProbability ?? 0, 1 - 0.2 * 0.5),
    `${projection.startProbability}`
  )
  check(
    "floor is NOT summed — it is gameweek level",
    projection.floor === 2,
    `${projection.floor}`
  )
  check(
    "ceiling is NOT summed — it is gameweek level",
    projection.ceiling === 14,
    `${projection.ceiling}`
  )
}

console.log("\nTriple gameweek aggregation")
{
  const projection = aggregateProjectionRows([
    sqRow({ fixture_id: 1, xP: 2, p_start: 0.5 }),
    sqRow({ fixture_id: 2, xP: 3, p_start: 0.5 }),
    sqRow({ fixture_id: 3, xP: 4, p_start: 0.5 }),
  ])
  check("xP summed over three fixtures", near(projection.expectedPoints, 9))
  check(
    "start probability compounds across three fixtures",
    near(projection.startProbability ?? 0, 1 - 0.125),
    `${projection.startProbability}`
  )
  check("fixture count is 3", projection.fixtures === 3)
}

console.log("\nProjection lookup")
{
  const payload = {
    rows: [
      sqRow({ player_id: 10, fixture_id: 100, xP: 5 }),
      sqRow({ player_id: 10, fixture_id: 101, xP: 3 }),
      sqRow({ player_id: 20, fixture_id: 100, xP: 2 }),
    ],
  } as unknown as SqPayload

  const lookup = buildProjectionLookup(payload)
  check("one entry per player", lookup.size === 2)
  check(
    "double gameweek player is summed",
    near(lookup.get(10)?.expectedPoints ?? 0, 8)
  )
  check(
    "single gameweek player is unchanged",
    near(lookup.get(20)?.expectedPoints ?? 0, 2)
  )
  check("fixture counts are correct", lookup.get(10)?.fixtures === 2)
}

console.log("\nApplying projections to players")
{
  const basePlayer: DashboardPlayer = {
    id: 10,
    firstName: "Test",
    secondName: "Player",
    webName: "Test",
    position: "MID",
    team: 1,
    clubName: "Arsenal",
    clubAbbrev: "ARS",
    priceTenths: 80,
    totalPoints: 40,
    form: 3,
    minutes: 900,
    starts: 10,
    goals: 2,
    assists: 3,
    cleanSheets: 4,
    bonus: 6,
    bps: 30,
    saves: 0,
    yellowCards: 1,
    redCards: 0,
    lastGameweekPoints: 6,
    status: "a",
    news: "",
    selectedByPercent: 10,
    chanceOfPlaying: 100,
    fplProjection: { source: "fpl", expectedPoints: 4.5, fixtures: 1 },
    sidelineQuantProjection: null,
    expectedPoints: 4.5,
    expectedPointsSource: "fpl",
    fixtureCount: 1,
    opponents: ["Chelsea"],
    opponentAbbrevs: ["CHE"],
    kickoffs: ["2026-11-21T12:30:00Z"],
    atHome: true,
  }

  const lookup = buildProjectionLookup({
    rows: [sqRow({ player_id: 10, xP: 5.5, e_mins: 88, p_start: 0.9 })],
  } as unknown as SqPayload)

  const applied = applyProjections([basePlayer], lookup)
  check("projection attached", applied[0].sidelineQuantProjection !== null)
  check(
    "expected points carried over",
    near(applied[0].sidelineQuantProjection?.expectedPoints ?? 0, 5.5)
  )
  check(
    "official projection left untouched",
    applied[0].fplProjection?.expectedPoints === 4.5
  )
  check("both providers coexist", applied[0].fplProjection !== null)

  // A player with no projection row must not be given a fake zero
  const missing = applyProjections([{ ...basePlayer, id: 99 }], lookup)
  check(
    "missing projection stays null, not zero",
    missing[0].sidelineQuantProjection === null
  )
}

console.log(
  failures === 0
    ? "\nAll transformation tests passed.\n"
    : `\n${failures} test(s) FAILED.\n`
)
process.exit(failures === 0 ? 0 : 1)
