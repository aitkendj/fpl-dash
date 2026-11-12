/**
 * Live integration check.
 *
 * Run with: npm run test:live
 *
 * Exercises the real server-side clients against the live FPL API and
 * the Sideline Quant feed, then asserts the joins and aggregations hold
 * against genuine data. Not part of `npm test` because it needs network.
 */
import {
  FPL_TEAM_ID,
  fetchBootstrapRaw,
  fetchEntry,
  fetchHistory,
  fetchPicks,
  fetchFixturesRaw,
} from "../src/lib/server/fpl"
import { fetchProjectionsRaw } from "../src/lib/server/sidelinequant"
import {
  buildElementContext,
  buildProjectionLookup,
  buildSquad,
  transformElement,
  applyProjections,
} from "../src/lib/transform"
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

async function main() {
  console.log("\nFetching from the live FPL API")
  const bootstrap = await fetchBootstrapRaw()
  const entry = await fetchEntry()
  const history = await fetchHistory()
  const fixtures = await fetchFixturesRaw()
  const projections = await fetchProjectionsRaw()
  
  check("bootstrap has players", bootstrap.elements.length > 400, `${bootstrap.elements.length}`)
  check("bootstrap has 20 clubs", bootstrap.teams.length === 20)
  check("bootstrap has 38 gameweeks", bootstrap.events.length === 38)
  check("manager profile loaded", entry.id === FPL_TEAM_ID, `id ${entry.id}`)
  check("history has gameweeks", history.current.length > 0)
  
  const currentEvent =
    bootstrap.events.find((event) => event.is_current)?.id ?? entry.current_event
  const nextEvent =
    bootstrap.events.find((event) => event.is_next)?.id ?? currentEvent + 1
  
  console.log(
    `\n  Live state: ${entry.name} · GW${currentEvent} current, GW${nextEvent} next · ${entry.summary_overall_points} pts · rank ${entry.summary_overall_rank.toLocaleString()} · bank £${entry.last_deadline_bank}m`
  )
  
  console.log("\nPicks")
  const picks = await fetchPicks(currentEvent)
  check("15 picks", picks.picks.length === 15, `${picks.picks.length}`)
  check(
    "eleven starters",
    picks.picks.filter((pick) => pick.position <= 11).length === 11
  )
  check("four substitutes", picks.picks.filter((pick) => pick.position > 11).length === 4)
  check("exactly one captain", picks.picks.filter((pick) => pick.is_captain).length === 1)
  check("exactly one vice-captain", picks.picks.filter((pick) => pick.is_vice_captain).length === 1)
  
  console.log("\nPlayer transformation")
  const context = buildElementContext(bootstrap, fixtures, nextEvent)
  let players: DashboardPlayer[] = bootstrap.elements.map((element) =>
    transformElement(element, context)
  )
  
  check("every element transformed", players.length === bootstrap.elements.length)
  check(
    "no unknown clubs",
    players.every((player) => player.clubName !== "Unknown")
  )
  check(
    "prices are positive and in a sane range",
    players.every((player) => player.priceTenths > 0 && player.priceTenths < 2000)
  )
  
  const raya = players.find((player) => player.webName === "Raya")
  if (raya) {
    console.log(
      `  Raya: ${raya.clubName} · £${(raya.priceTenths / 10).toFixed(1)}m · ${raya.totalPoints} pts · ${raya.status}`
    )
    check(
      "price matches FPL now_cost exactly",
      raya.priceTenths ===
        (bootstrap.elements.find((e) => e.id === raya.id)?.now_cost ?? -1)
    )
    check(
      "price displays correctly in millions",
      near(raya.priceTenths / 10, 6.2, 0.05),
      `${(raya.priceTenths / 10).toFixed(2)}`
    )
  }
  
  console.log("\nSideline Quant join")
  const lookup = buildProjectionLookup(projections)
  const sqIds = new Set(projections.rows.map((row) => row.player_id))
  const fplIds = new Set(bootstrap.elements.map((element) => element.id))
  const unmatched = [...sqIds].filter((id) => !fplIds.has(id))
  
  check("every SQ player id exists in FPL", unmatched.length === 0, unmatched.join(","))
  check(
    "SQ covers the whole player pool",
    sqIds.size === bootstrap.elements.length,
    `${sqIds.size} vs ${bootstrap.elements.length}`
  )
  check(
    "SQ gameweek matches the next FPL gameweek",
    projections.gameweek === nextEvent,
    `SQ ${projections.gameweek} vs FPL ${nextEvent}`
  )
  
  players = applyProjections(players, lookup)
  const withProjection = players.filter((p) => p.sidelineQuantProjection !== null)
  check("projections attached to every player", withProjection.length === players.length)
  
  console.log("\nCross-source price agreement")
  {
    const sqById = new Map(projections.rows.map((row) => [row.player_id, row]))
    let agreed = 0
    const disagreed: string[] = []
    for (const player of players) {
      const row = sqById.get(player.id)
      if (!row) continue
      if (row.price_tenths === player.priceTenths) agreed++
      else {
        disagreed.push(
          `${player.webName} (FPL ${player.priceTenths / 10} vs SQ ${row.price_tenths / 10})`
        )
      }
    }
    // The two feeds refresh independently, so a price that has crossed a
    // change point since the model last ran will differ by 10p. A small
    // number of these is expected; the dashboard always uses FPL's
    // authoritative price.
    check(
      "prices agree for all but a handful of recently-changed players",
      disagreed.length <= 5,
      `${disagreed.length} differ: ${disagreed.join(", ")}`
    )
    console.log(
      `  ${agreed} identical, ${disagreed.length} differ by a price change`
    )
  }
  
  console.log("\nFixture assignment")
  {
    const withFixtures = players.filter((player) => player.fixtureCount > 0)
    check(
      "players have fixtures in the next gameweek",
      withFixtures.length > 0,
      `${withFixtures.length} players`
    )
    const multiFixture = players.filter((player) => player.fixtureCount > 1)
    console.log(
      `  Double gameweek players this gameweek: ${multiFixture.length}`
    )
    check(
      "opponent count matches fixture count",
      players.every(
        (player) => player.opponents.length === player.fixtureCount
      )
    )
  }
  
  console.log("\nSquad join")
  {
    const squad = buildSquad(players, picks)
    check("squad has 15 players", squad.length === 15, `${squad.length}`)
    check("captain identified", squad.filter((p) => p.isCaptain).length === 1)
    check("vice-captain identified", squad.filter((p) => p.isViceCaptain).length === 1)
    check("eleven starters", squad.filter((p) => !p.isSubstitute).length === 11)
    check("four substitutes", squad.filter((p) => p.isSubstitute).length === 4)
    check(
      "no duplicate players",
      new Set(squad.map((p) => p.id)).size === 15
    )
    check(
      "every squad player has a name and club",
      squad.every((p) => p.webName.length > 0 && p.clubName !== "Unknown")
    )
  
    console.log("\n  Your squad:")
    for (const player of squad) {
      const eps = player.sidelineQuantProjection?.expectedPoints ?? 0
      const fplEps = player.fplProjection?.expectedPoints ?? 0
      const tag = player.isCaptain
        ? " (C)"
        : player.isViceCaptain
          ? " (VC)"
          : ""
      console.log(
        `    ${player.pickPosition.toString().padStart(2)}. ${player.webName.padEnd(16)} ${player.clubAbbrev.padEnd(4)} £${(player.priceTenths / 10).toFixed(1).padStart(5)}m  SQ ${eps.toFixed(2).padStart(5)}  FPL ${String(fplEps).padStart(4)}${tag}`
      )
    }
  }
  
  console.log("\nHistory")
  {
    check(
      "history rows are sequential",
      history.current.every((row, index) => row.event === index + 1)
    )
    const last = history.current[history.current.length - 1]
    check(
      "latest history points match the manager summary",
      last.points === entry.summary_event_points,
      `${last.points} vs ${entry.summary_event_points}`
    )
    check(
      "latest history total matches the manager summary",
      last.total_points === entry.summary_overall_points,
      `${last.total_points} vs ${entry.summary_overall_points}`
    )
    check(
      "latest history rank is within a few places of the manager summary",
      Math.abs(last.overall_rank - entry.summary_overall_rank) <= 50,
      `${last.overall_rank} vs ${entry.summary_overall_rank}`
    )
  }
  
  console.log("\nAttribution")
  check(
    "Sideline Quant licence is CC BY 4.0",
    projections.licence?.name === "CC BY 4.0",
    projections.licence?.name
  )
  check(
    "Sideline Quant attribution string is present",
    typeof projections.licence?.attribution === "string" &&
      projections.licence.attribution.length > 0
  )
  
  console.log(
    failures === 0
      ? "\nAll live integration checks passed.\n"
      : `\n${failures} live check(s) FAILED.\n`
  )
  process.exit(failures === 0 ? 0 : 1)
  
}

main().catch((error) => {
  console.error("Live check crashed:", error)
  process.exit(1)
})
