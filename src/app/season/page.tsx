"use client"

import { Trophy, TrendingUp, Clock, Zap } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"

import { getDashboardData } from "@/data/provider"
import { formatNumber } from "@/lib/utils"

import { Card, CardHeader, CardBody, PageHeader } from "@/components/ui/Card"
import { StatTile } from "@/components/ui/StatTile"
import { ChartTooltip, chartAxisProps } from "@/components/ui/Chart"

export default function SeasonOverviewPage() {
  const data = getDashboardData()
  const { season, gameweeks, totalManagers } = data

  const rankData = gameweeks.map((gw) => ({
    gameweek: `GW${gw.gameweek}`,
    rank: gw.overall_rank,
    points: gw.points,
  }))

  const pointsData = gameweeks.map((gw) => ({
    gameweek: `GW${gw.gameweek}`,
    points: gw.points,
  }))

  const seasonAverage = season.average_points_per_game

  return (
    <div className="animate-rise space-y-8">
      <PageHeader
        eyebrow={`Team ${data.teamId}`}
        title="Season Overview"
        description="How the season has unfolded — rank trajectory and gameweek returns."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Overall rank"
          value={formatNumber(season.overall_rank)}
          meta={`of ${(totalManagers / 1e6).toFixed(1)}m managers`}
          delta={season.rank_change}
          deltaLabel="vs GW37"
          icon={<TrendingUp className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Total points"
          value={formatNumber(season.total_points)}
          meta="Season total"
          icon={<Trophy className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Average per GW"
          value={season.average_points_per_game.toFixed(1)}
          meta={`Across ${data.seasonLength} gameweeks`}
          icon={<Clock className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Best gameweek"
          value={`GW${season.best_gameweek.gameweek}`}
          meta={`${season.best_gameweek.points} points`}
          delta={season.best_gameweek.points - season.average_points_per_game}
          deltaLabel="above average"
          icon={<Zap className="h-4 w-4" strokeWidth={1.8} />}
        />
      </div>

      {/* Rank journey */}
      <Card>
        <CardHeader
          title="Overall rank journey"
          description="Improvement moves upward — the axis is inverted so a rising line means a better rank."
        />
        <CardBody className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rankData}
                margin={{ top: 8, right: 16, bottom: 4, left: 4 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="2 4"
                  stroke="var(--color-line)"
                />
                <XAxis
                  dataKey="gameweek"
                  {...chartAxisProps}
                  interval={3}
                  tickMargin={10}
                />
                <YAxis
                  reversed
                  domain={["dataMin - 2000", "dataMax + 2000"]}
                  {...chartAxisProps}
                  tickMargin={8}
                  tickFormatter={(v: number) => formatNumber(v)}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(value: number) => [
                        formatNumber(value),
                        "Overall rank",
                      ]}
                    />
                  }
                  cursor={{ stroke: "var(--color-line-strong)", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="rank"
                  stroke="var(--color-ink)"
                  strokeWidth={1.75}
                  dot={false}
                  activeDot={{
                    r: 3.5,
                    fill: "var(--color-ink)",
                    stroke: "var(--color-surface)",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* Points by gameweek */}
      <Card>
        <CardHeader
          title="Points by gameweek"
          description="Weekly returns against the season average."
        />
        <CardBody className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={pointsData}
                margin={{ top: 8, right: 16, bottom: 4, left: 4 }}
              >
                <defs>
                  <linearGradient id="pointsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-positive-bright)"
                      stopOpacity={0.18}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-positive-bright)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="2 4"
                  stroke="var(--color-line)"
                />
                <XAxis
                  dataKey="gameweek"
                  {...chartAxisProps}
                  interval={3}
                  tickMargin={10}
                />
                <YAxis
                  domain={[0, "dataMax + 12"]}
                  {...chartAxisProps}
                  tickMargin={8}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(value: number) => [value, "Points"]}
                    />
                  }
                  cursor={{ stroke: "var(--color-line-strong)", strokeWidth: 1 }}
                />
                <ReferenceLine
                  y={seasonAverage}
                  stroke="var(--color-ink-tertiary)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: `avg ${seasonAverage.toFixed(1)}`,
                    position: "insideTopRight",
                    fill: "var(--color-ink-tertiary)",
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="var(--color-positive)"
                  strokeWidth={1.75}
                  dot={false}
                  activeDot={{
                    r: 3.5,
                    fill: "var(--color-positive)",
                    stroke: "var(--color-surface)",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
