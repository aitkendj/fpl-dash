"use client"

import { useState } from "react"
import {
  Zap,
  Wallet,
  Repeat,
  Trophy,
  Clock,
} from "lucide-react"

import { getDashboardData } from "@/data/provider"
import {
  calculateTeamExpectedPoints,
  calculateTotalPoints,
} from "@/lib/calculations"
import {
  buildFormationSlots,
  selectStartingEleven,
  selectSubstitutes,
  FORMATIONS,
} from "@/lib/formation"
import { cn, formatNumber, formatPrice } from "@/lib/utils"

import { Card, CardHeader, CardBody, PageHeader, SectionHeader } from "@/components/ui/Card"
import { StatTile } from "@/components/ui/StatTile"
import { Badge, PositionBadge, ClubBadge, CaptainBadge } from "@/components/ui/Badge"
import { SegmentedControl } from "@/components/ui/Button"
import { Pitch, type FormationSlot } from "@/components/my-team/Pitch"

export default function MyTeamPage() {
  const [formation, setFormation] = useState("3-4-3")

  const data = getDashboardData()
  const { squad, season, currentGameweek, clubAbbrevs } = data

  const starters = selectStartingEleven(squad, formation)
  const substitutes = selectSubstitutes(squad)

  const slots: FormationSlot[] = buildFormationSlots(
    formation,
    starters
  ).map((slot) => ({
    role: slot.role,
    x: slot.x,
    y: slot.y,
    player: slot.player,
  }))

  const captain = squad.find((p) => p.is_captain)
  const viceCaptain = squad.find((p) => p.is_vice_captain)

  const teamExpectedPoints = calculateTeamExpectedPoints(squad, captain?.id)

  // Season totals come from the gameweek ledger, not the squad sum —
  // the difference is the captain multiplier and substitute appearances.
  const squadPlayerPoints = calculateTotalPoints(squad)

  // The bench runs in reverse priority order for display
  const benchOrder = ["GK", "DEF", "MID", "FWD"]
  const orderedSubstitutes = [...substitutes].sort(
    (a, b) =>
      benchOrder.indexOf(a.position) - benchOrder.indexOf(b.position)
  )

  return (
    <div className="animate-rise space-y-8">
      <PageHeader
        eyebrow={`Team ${data.teamId}`}
        title="My Team"
        description="Your starting eleven, bench and projected return for the next gameweek."
        action={
          <SegmentedControl
            value={formation}
            onValueChange={setFormation}
            options={Object.keys(FORMATIONS).map((f) => ({
              value: f,
              label: f,
            }))}
          />
        }
      />

      {/* Summary metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          label="Latest points"
          value={season.latest_gameweek_points}
          meta={`Gameweek ${currentGameweek}`}
          delta={
            season.latest_gameweek_points - season.previous_gameweek_points
          }
          deltaLabel="vs previous GW"
          icon={<Zap className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Overall points"
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
          label="Free transfers"
          value={2}
          meta="Remaining this week"
          icon={<Repeat className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Money in bank"
          value="£2.5m"
          meta="Available to spend"
          icon={<Wallet className="h-4 w-4" strokeWidth={1.8} />}
        />
      </div>

      {/* Pitch + squad summary */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Starting eleven"
            description={`${formation} · Gameweek 38`}
            action={
              <div className="flex items-center gap-2">
                {captain && (
                  <Badge tone="inverse">
                    C · {captain.web_name}
                  </Badge>
                )}
                {viceCaptain && (
                  <Badge tone="outline">VC · {viceCaptain.web_name}</Badge>
                )}
              </div>
            }
          />
          <CardBody className="p-0">
            <Pitch slots={slots} className="rounded-none border-0 border-t border-line" />
          </CardBody>
        </Card>

        <div className="grid gap-6 2xl:grid-cols-2">
          {/* Projected return */}
          <Card>
            <CardHeader
              title="Projected return"
              description="Next gameweek, captaincy weighted"
            />
            <CardBody>
              <p className="display-numeral text-5xl text-ink">
                {teamExpectedPoints.toFixed(1)}
              </p>
              <p className="mt-2 text-sm text-ink-tertiary">
                Expected points across all {squad.length} squad players
              </p>

              <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-secondary">Squad size</dt>
                  <dd data-numeric className="font-medium text-ink">
                    {squad.length} players
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-secondary">Captain bonus</dt>
                  <dd data-numeric className="font-medium text-positive">
                    +
                    {(captain?.expected_points ?? 0).toFixed(1)} pts
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-secondary">Bench contribution</dt>
                  <dd data-numeric className="font-medium text-ink">
                    {substitutes
                      .reduce((sum, p) => sum + p.expected_points, 0)
                      .toFixed(1)}{" "}
                    pts
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2.5">
                  <dt className="text-ink-secondary">Player points</dt>
                  <dd data-numeric className="font-medium text-ink">
                    {formatNumber(squadPlayerPoints)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-secondary">Season total</dt>
                  <dd
                    data-numeric
                    className="font-semibold text-ink"
                    title="Player points plus the captain multiplier"
                  >
                    {formatNumber(season.total_points)}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          {/* Bench */}
          <Card>
            <CardHeader
              title="Bench"
              description={`${substitutes.length} substitutes available`}
            />
            <CardBody className="p-0">
              <ul className="divide-y divide-line">
                {orderedSubstitutes.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-subtle/60"
                  >
                    <ClubBadge code={clubAbbrevs[player.team]} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {player.web_name}
                      </p>
                      <p className="text-xs text-ink-tertiary">
                        {player.position} · {formatPrice(player.now_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        data-numeric
                        className="text-sm font-semibold text-ink"
                      >
                        {player.expected_points.toFixed(1)}
                      </p>
                      <p className="text-2xs uppercase tracking-wide text-ink-tertiary">
                        xP
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Full squad table */}
      <section>
        <SectionHeader
          title="Squad"
          description="All fifteen players with form and projection"
        />
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-subtle/50">
                  <Th className="pl-5">Player</Th>
                  <Th>Pos</Th>
                  <Th>Club</Th>
                  <Th align="right">Price</Th>
                  <Th align="right">GW38</Th>
                  <Th align="right">xMins</Th>
                  <Th align="right">xPts</Th>
                  <Th className="pr-5">Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {squad.map((player) => (
                  <tr
                    key={player.id}
                    className="transition-colors hover:bg-surface-subtle/40"
                  >
                    <td className="pl-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">
                          {player.web_name}
                        </span>
                        {player.is_captain && <CaptainBadge />}
                        {player.is_vice_captain && (
                          <CaptainBadge kind="vice" />
                        )}
                        {player.is_substitute && (
                          <Badge tone="outline" className="ml-0.5">
                            Sub
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <PositionBadge position={player.position} />
                    </td>
                    <td className="text-ink-secondary">
                      {clubAbbrevs[player.team]}
                    </td>
                    <td data-numeric className="text-right text-ink-secondary">
                      {formatPrice(player.now_price)}
                    </td>
                    <td
                      data-numeric
                      className={cn(
                        "text-right font-medium",
                        player.last_gameweek_points >= 6
                          ? "text-positive"
                          : player.last_gameweek_points <= 2
                            ? "text-negative"
                            : "text-ink"
                      )}
                    >
                      {player.last_gameweek_points}
                    </td>
                    <td data-numeric className="text-right text-ink-secondary">
                      {player.expected_minutes}
                    </td>
                    <td
                      data-numeric
                      className="text-right font-semibold text-ink"
                    >
                      {player.expected_points.toFixed(1)}
                    </td>
                    <td className="pr-5 text-ink-secondary">
                      {player.status === "a" ? "Available" : "Unavailable"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}

function Th({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode
  align?: "left" | "right"
  className?: string
}) {
  return (
    <th
      scope="col"
      className={cn(
        "py-2 text-2xs font-semibold uppercase tracking-[0.09em] text-ink-tertiary",
        align === "right" ? "pr-4 text-right" : "pr-4 text-left",
        className
      )}
    >
      {children}
    </th>
  )
}
