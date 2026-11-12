"use client"

import { useMemo, useState } from "react"
import { Trophy, Clock, Wallet, Zap, TrendingUp } from "lucide-react"

import type { SquadPlayer, ManagerSummary, GameweekHistoryRow } from "@/lib/model"
import {
  buildFormationSlots,
  selectStartingEleven,
  selectSubstitutes,
  FORMATIONS,
} from "@/lib/formation"
import { teamExpectedPoints } from "@/lib/transfers"
import { cn, formatNumber } from "@/lib/utils"

import {
  Card,
  CardHeader,
  CardBody,
  PageHeader,
  SectionHeader,
} from "@/components/ui/Card"
import { StatTile } from "@/components/ui/StatTile"
import { Badge, PositionBadge, CaptainBadge } from "@/components/ui/Badge"
import { SegmentedControl } from "@/components/ui/Button"
import { Table, THead, TBody, Th, Td, Tr } from "@/components/ui/Table"
import { Pitch, type FormationSlot } from "@/components/my-team/Pitch"
import { SeasonCharts } from "@/components/season-overview/SeasonCharts"
import { ModelBadge } from "@/components/system/SourceBanner"

export function MyTeamView({
  squad,
  manager,
  history,
}: {
  squad: SquadPlayer[]
  manager: ManagerSummary | null
  history: GameweekHistoryRow[]
}) {
  const [formation, setFormation] = useState("3-4-3")

  const starters = useMemo(
    () => selectStartingEleven(squad, formation),
    [squad, formation]
  )
  const substitutes = useMemo(() => selectSubstitutes(squad), [squad])

  const slots: FormationSlot[] = useMemo(
    () =>
      buildFormationSlots(formation, starters).map((slot) => ({
        role: slot.role,
        x: slot.x,
        y: slot.y,
        player: slot.player,
      })),
    [formation, starters]
  )

  const captain = squad.find((p) => p.isCaptain)
  const viceCaptain = squad.find((p) => p.isViceCaptain)

  // Team expected points, captaincy weighted
  const teamExpected = teamExpectedPoints(
    squad.map((player) => ({
      id: player.id,
      expectedPoints: player.expectedPoints,
    })),
    captain?.id
  )

  const latestPoints = manager?.eventPoints ?? 0
  const previousPoints = manager?.previousGameweekPoints ?? 0
  const totalPoints = manager?.totalPoints ?? 0
  const averagePoints =
    history.length > 0
      ? history.reduce((sum, row) => sum + row.points, 0) / history.length
      : 0

  const firstRank = history[0]?.overallRank ?? 0
  const lastRank = history[history.length - 1]?.overallRank ?? 0
  const rankChange = firstRank - lastRank

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={manager?.name ?? "My Team"}
        title="Team Overview"
        description="Your squad, projected return and how the season has unfolded."
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
          value={latestPoints}
          meta={`Gameweek ${manager?.currentGameweek ?? "—"}`}
          delta={latestPoints - previousPoints}
          deltaLabel="vs previous GW"
          icon={<Zap className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Overall points"
          value={formatNumber(totalPoints)}
          meta="Season total"
          icon={<Trophy className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Average per GW"
          value={averagePoints.toFixed(1)}
          meta={`Across ${history.length} gameweeks`}
          icon={<Clock className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Overall rank"
          value={formatNumber(manager?.overallRank ?? 0)}
          meta="Season position"
          delta={rankChange}
          deltaLabel="since GW1"
          icon={<TrendingUp className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Money in bank"
          value={`£${(manager?.bank ?? 0).toFixed(1)}m`}
          meta="Available to spend"
          icon={<Wallet className="h-4 w-4" strokeWidth={1.8} />}
        />
      </div>

      {/* Pitch + squad + projection */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        {/* Pitch with bench */}
        <Card className="overflow-hidden">
          <CardHeader
            title="Starting eleven"
            description={`${formation} · Gameweek ${manager?.nextGameweek ?? "—"}`}
            action={
              <div className="flex items-center gap-2">
                {captain && (
                  <Badge tone="inverse">C · {captain.webName}</Badge>
                )}
                {viceCaptain && (
                  <Badge tone="outline">VC · {viceCaptain.webName}</Badge>
                )}
              </div>
            }
          />
          <CardBody className="p-0">
            <Pitch
              slots={slots}
              bench={substitutes}
              className="rounded-none"
            />
          </CardBody>
        </Card>

        {/* Squad table + projected return */}
        <div className="space-y-6">
          {/* Projected return */}
          <Card>
            <CardHeader
              title="Projected return"
              description="Next gameweek, captaincy weighted"
              action={<ModelBadge />}
            />
            <CardBody>
              <p className="display-numeral text-5xl text-ink">
                {teamExpected.toFixed(1)}
              </p>
              <p className="mt-2 text-sm text-ink-tertiary">
                Expected points across all {squad.length} squad players
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-line pt-4 text-sm">
                <Row label="Squad size" value={`${squad.length} players`} />
                <Row
                  label="Captain bonus"
                  value={`+${(captain?.expectedPoints ?? 0).toFixed(1)} pts`}
                  tone="positive"
                />
                <Row
                  label="Bench contribution"
                  value={`${substitutes
                    .reduce((sum, p) => sum + p.expectedPoints, 0)
                    .toFixed(1)} pts`}
                />
                <Row
                  label="Team value"
                  value={`£${(manager?.teamValue ?? 0).toFixed(1)}m`}
                />
                <Row
                  label="Transfers made"
                  value={`${manager?.totalTransfers ?? 0}`}
                />
                <Row
                  label="Free transfers"
                  value="2 remaining"
                />
              </dl>
            </CardBody>
          </Card>

          {/* Squad table */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Squad"
              description="All fifteen players with actual form and modelled projection"
              action={<ModelBadge />}
            />
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <THead>
                  <tr>
                    <Th>Player</Th>
                    <Th align="center">Pos</Th>
                    <Th align="center">Opponent</Th>
                    <Th align="center">Price</Th>
                    <Th align="center">Last GW</Th>
                    <Th align="center">Season</Th>
                    <Th align="center">Form</Th>
                    <Th align="center" className="pr-5">
                      xPts
                    </Th>
                  </tr>
                </THead>
                <TBody>
                  {squad.map((player) => (
                    <Tr key={player.id}>
                      <Td className="pl-5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">
                            {player.webName}
                          </span>
                          {player.isCaptain && <CaptainBadge />}
                          {player.isViceCaptain && (
                            <CaptainBadge kind="vice" />
                          )}
                          {player.isSubstitute && (
                            <Badge tone="outline" className="ml-0.5">
                              Sub
                            </Badge>
                          )}
                        </div>
                      </Td>
                      <Td align="center">
                        <PositionBadge position={player.position} />
                      </Td>
                      <Td align="center" className="text-ink-secondary">
                        {player.opponents.length > 0
                          ? player.opponents.join(" + ")
                          : "—"}
                        {player.fixtureCount > 1 && (
                          <Badge tone="caution" className="ml-1.5">
                            2 fixtures
                          </Badge>
                        )}
                      </Td>
                      <Td align="center" numeric>
                        £{(player.priceTenths / 10).toFixed(1)}m
                      </Td>
                      <Td
                        align="center"
                        numeric
                        className={cn(
                          "font-medium",
                          player.lastGameweekPoints >= 6
                            ? "text-positive"
                            : player.lastGameweekPoints <= 2
                              ? "text-negative"
                              : "text-ink"
                        )}
                      >
                        {player.lastGameweekPoints}
                      </Td>
                      <Td align="center" numeric>
                        {player.totalPoints}
                      </Td>
                      <Td align="center" numeric>
                        {player.form.toFixed(1)}
                      </Td>
                      <Td
                        align="center"
                        numeric
                        className="pr-5 font-semibold text-model"
                      >
                        {player.expectedPoints.toFixed(1)}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      {/* Season charts */}
      <section className="space-y-6">
        <SectionHeader
          title="Season"
          description="Rank trajectory and gameweek returns across the season so far"
        />
        <SeasonCharts history={history} />
      </section>
    </div>
  )
}

function Row({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "positive"
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-secondary">{label}</dt>
      <dd
        data-numeric
        className={cn(
          "font-medium",
          tone === "positive" ? "text-positive" : "text-ink"
        )}
      >
        {value}
      </dd>
    </div>
  )
}
