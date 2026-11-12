"use client"

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

import type { GameweekHistoryRow } from "@/lib/model"
import { formatNumber } from "@/lib/utils"
import { Card, CardHeader, CardBody } from "@/components/ui/Card"
import { ChartTooltip, chartAxisProps } from "@/components/ui/Chart"

export function SeasonCharts({ history }: { history: GameweekHistoryRow[] }) {
  const rankData = history.map((row) => ({
    gameweek: `GW${row.gameweek}`,
    rank: row.overallRank,
    points: row.points,
  }))

  const pointsData = history.map((row) => ({
    gameweek: `GW${row.gameweek}`,
    points: row.points,
  }))

  const average =
    history.length > 0
      ? history.reduce((sum, row) => sum + row.points, 0) / history.length
      : 0

  return (
    <div className="space-y-6">
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
                  interval={Math.max(0, Math.floor(rankData.length / 8) - 1)}
                  tickMargin={10}
                />
                <YAxis
                  reversed
                  domain={["dataMin - 2000", "dataMax + 2000"]}
                  {...chartAxisProps}
                  tickMargin={8}
                  tickFormatter={(value: number) => formatNumber(value)}
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
                  interval={Math.max(0, Math.floor(pointsData.length / 8) - 1)}
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
                  y={average}
                  stroke="var(--color-ink-tertiary)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: `avg ${average.toFixed(1)}`,
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

      {/* Season record */}
      <Card>
        <CardHeader title="Gameweek by gameweek" />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-subtle/50">
                  <th className="py-2 pl-5 text-left text-2xs font-semibold uppercase tracking-[0.09em] text-ink-tertiary">
                    Gameweek
                  </th>
                  <th className="py-2 pr-4 text-right text-2xs font-semibold uppercase tracking-[0.09em] text-ink-tertiary">
                    Points
                  </th>
                  <th className="py-2 pr-4 text-right text-2xs font-semibold uppercase tracking-[0.09em] text-ink-tertiary">
                    Total
                  </th>
                  <th className="py-2 pr-4 text-right text-2xs font-semibold uppercase tracking-[0.09em] text-ink-tertiary">
                    Rank
                  </th>
                  <th className="py-2 pr-4 text-right text-2xs font-semibold uppercase tracking-[0.09em] text-ink-tertiary">
                    Transfers
                  </th>
                  <th className="py-2 pr-5 text-right text-2xs font-semibold uppercase tracking-[0.09em] text-ink-tertiary">
                    Bench
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...history].reverse().map((row) => (
                  <tr
                    key={row.gameweek}
                    className="transition-colors hover:bg-surface-subtle/40"
                  >
                    <td className="py-2.5 pl-5 font-medium text-ink">
                      GW{row.gameweek}
                    </td>
                    <td
                      data-numeric
                      className="py-2.5 pr-4 text-right font-medium text-ink"
                    >
                      {row.points}
                    </td>
                    <td
                      data-numeric
                      className="py-2.5 pr-4 text-right text-ink-secondary"
                    >
                      {formatNumber(row.totalPoints)}
                    </td>
                    <td
                      data-numeric
                      className="py-2.5 pr-4 text-right text-ink-secondary"
                    >
                      {formatNumber(row.overallRank)}
                    </td>
                    <td
                      data-numeric
                      className="py-2.5 pr-4 text-right text-ink-secondary"
                    >
                      {row.transfers}
                    </td>
                    <td
                      data-numeric
                      className="py-2.5 pr-5 text-right text-ink-secondary"
                    >
                      {row.pointsOnBench}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
