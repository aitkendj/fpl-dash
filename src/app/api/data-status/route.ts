import { NextResponse } from "next/server"
import { loadDashboardSnapshot } from "@/lib/server/snapshot"

/**
 * Diagnostics endpoint.
 *
 * Reports the health of each external source and a summary of what was
 * retrieved. Useful for confirming the data is genuinely live, and for
 * spotting when a feed is failing.
 */

export async function GET() {
  const started = Date.now()

  try {
    const snapshot = await loadDashboardSnapshot()

    return NextResponse.json({
      ok: snapshot.status.complete,
      durationMs: Date.now() - started,
      manager: snapshot.manager,
      squadSize: snapshot.squad.length,
      playerCount: snapshot.players.length,
      historyLength: snapshot.history.length,
      projectionGameweek: snapshot.projectionGameweek,
      chips: snapshot.chips,
      status: {
        complete: snapshot.status.complete,
        degraded: snapshot.status.degraded,
        sources: snapshot.status.sources.map((source) => ({
          ...source,
          fetchedAt: source.fetchedAt?.toISOString() ?? null,
        })),
      },
      sample: snapshot.squad.slice(0, 3).map((player) => ({
        id: player.id,
        name: player.webName,
        club: player.clubName,
        position: player.position,
        price: `£${(player.priceTenths / 10).toFixed(1)}m`,
        totalPoints: player.totalPoints,
        fplExpectedPoints: player.fplProjection?.expectedPoints ?? null,
        sidelineQuantExpectedPoints:
          player.sidelineQuantProjection?.expectedPoints ?? null,
        expectedMinutes:
          player.sidelineQuantProjection?.expectedMinutes ?? null,
        startProbability:
          player.sidelineQuantProjection?.startProbability ?? null,
        floor: player.sidelineQuantProjection?.floor ?? null,
        ceiling: player.sidelineQuantProjection?.ceiling ?? null,
        opponents: player.opponents,
        isCaptain: player.isCaptain,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - started,
      },
      { status: 502 }
    )
  }
}
