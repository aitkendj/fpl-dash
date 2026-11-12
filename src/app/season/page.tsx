import { loadDashboardSnapshot } from "@/lib/server/snapshot"
import { SeasonCharts } from "@/components/season-overview/SeasonCharts"
import { SourceBanner } from "@/components/system/SourceBanner"
import { StatTile } from "@/components/ui/StatTile"
import { PageHeader } from "@/components/ui/Card"
import { Trophy, TrendingUp, Clock, Zap } from "lucide-react"
import { formatNumber } from "@/lib/utils"

export default async function SeasonOverviewPage() {
  const snapshot = await loadDashboardSnapshot()
  const { manager, history } = snapshot

  const totalPoints = manager?.totalPoints ?? 0
  const averagePoints =
    history.length > 0
      ? history.reduce((sum, row) => sum + row.points, 0) / history.length
      : 0
  const best =
    history.length > 0
      ? history.reduce((bestRow, row) =>
          row.points > bestRow.points ? row : bestRow
        )
      : null
  const firstRank = history[0]?.overallRank ?? 0
  const lastRank = history[history.length - 1]?.overallRank ?? 0
  const rankChange = firstRank - lastRank

  return (
    <div className="space-y-6">
      <SourceBanner
        status={snapshot.status}
        projectionGameweek={snapshot.projectionGameweek}
      />

      <PageHeader
        eyebrow={manager ? manager.name : "Season"}
        title="Season Overview"
        description="How the season has unfolded — rank trajectory and gameweek returns."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Overall rank"
          value={formatNumber(manager?.overallRank ?? 0)}
          meta={`of ${((manager?.seasonLength ?? 0) * 300_000).toLocaleString("en-GB", { maximumFractionDigits: 0 })} managers`}
          delta={rankChange}
          deltaLabel="since GW1"
          icon={<TrendingUp className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Total points"
          value={formatNumber(totalPoints)}
          meta={`After ${history.length} gameweeks`}
          icon={<Trophy className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Average per GW"
          value={averagePoints.toFixed(1)}
          meta={`Across ${history.length} gameweeks`}
          icon={<Clock className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Best gameweek"
          value={best ? `GW${best.gameweek}` : "—"}
          meta={best ? `${best.points} points` : "No data"}
          delta={best ? best.points - averagePoints : undefined}
          deltaLabel="above average"
          icon={<Zap className="h-4 w-4" strokeWidth={1.8} />}
        />
      </div>

      <SeasonCharts history={history} />
    </div>
  )
}
