"use client"

import { useMemo, useState } from "react"
import { Trophy, Clock, Zap, TrendingUp } from "lucide-react"

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
import { StatTile, DeltaText } from "@/components/ui/StatTile"
import { Badge, PositionBadge, CaptainBadge } from "@/components/ui/Badge"
import { SegmentedControl, Select } from "@/components/ui/Button"
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

  /**
   * Captain selection.
   *
   * Defaults to the armband FPL actually has, but can be overridden so
   * the effect of a captaincy change can be modelled before making it.
   * The captain receives the 2x multiplier, so the team total moves with
   * the selection.
   */
  const [captainChoice, setCaptainChoice] = useState<string>("")

  const effectiveCaptain =
    squad.find((p) => p.id === Number(captainChoice)) ?? captain

  const epsFor = (captainId?: number) =>
    teamExpectedPoints(
      squad.map((player) => ({
        id: player.id,
        expectedPoints: player.expectedPoints,
      })),
      captainId
    )

  const epsActual = epsFor(captain?.id)
  const epsSelected = epsFor(effectiveCaptain?.id)
  const epsDelta = epsSelected - epsActual
  const isOverridden = effectiveCaptain?.id !== captain?.id
  const teamExpected = epsSelected

  const captainOptions = useMemo(
    () =>
      squad
        .slice()
        .sort((a, b) => b.expectedPoints - a.expectedPoints)
        .map((player) => ({
          value: String(player.id),
          label: `${player.webName} · ${player.expectedPoints.toFixed(1)}`,
        })),
    [squad]
  )

  const latestPoints = manager?.eventPoints ?? 0
  const previousPoints = manager?.previousGameweekPoints ?? 0
  const totalPoints = manager?.totalPoints ?? 0
  const averagePoints =
    history.length > 0
      ? history.reduce((sum, row) => sum + row.points, 0) / history.length
      : 0

  const lastRank = history[history.length - 1]?.overallRank ?? 0
  const previousRank = history[history.length - 2]?.overallRank ?? 0
  // The raw change in rank position. A negative number means the rank
  // improved (a lower position is better), so the tile inverts it.
  const rankChange = lastRank - previousRank

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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          deltaLabel="vs previous GW"
          deltaDecimals={0}
          invertDelta
          icon={<TrendingUp className="h-4 w-4" strokeWidth={1.8} />}
        />
      </div>

      {/* Starting XI + squad, aligned */}
      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Starting XI with bench */}
        <Card data-check="xi" className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader
            title="Starting XI"
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
          <CardBody className="flex min-h-0 flex-1 flex-col p-0">
            <Pitch
              slots={slots}
              bench={substitutes}
              className="flex min-h-0 flex-1 flex-col rounded-none"
            />
          </CardBody>
        </Card>

        {/* Squad table */}
        <Card data-check="squad" className="flex flex-col overflow-hidden">
          <CardHeader
            title="Squad"
            description={`All fifteen players · £${(manager?.bank ?? 0).toFixed(1)}m in the bank · £${(manager?.teamValue ?? 0).toFixed(1)}m squad value · ${manager?.totalTransfers ?? 0} transfers made`}
            action={
              <div className="flex items-end gap-5">
                {/* Captain selection */}
                <div className="w-44">
                  <label
                    className="eyebrow mb-1 block"
                    htmlFor="captain-select"
                  >
                    Captain
                  </label>
                  <Select
                    id="captain-select"
                    value={effectiveCaptain?.id ?? ""}
                    onValueChange={setCaptainChoice}
                    options={captainOptions}
                  />
                </div>

                {/* Team total, captaincy weighted */}
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="eyebrow">Team xPts</span>
                    <ModelBadge />
                  </div>
                  <div className="mt-1 flex items-baseline justify-end gap-2">
                    {isOverridden && (
                      <DeltaText value={epsDelta} showIcon className="text-sm" />
                    )}
                    <p className="display-numeral text-3xl text-ink">
                      {teamExpected.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            }
          />
          <div className="min-h-0 flex-1 overflow-auto">
            <Table className="min-w-[640px]">
              <THead className="sticky top-0 z-10">
                <tr>
                  <Th className="pl-5">Player</Th>
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
                {squad.map((player) => {
                  const isEffectiveCaptain =
                    effectiveCaptain?.id === player.id
                  return (
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
                        className={cn(
                          "pr-5 font-semibold",
                          isEffectiveCaptain ? "text-model" : "text-model"
                        )}
                      >
                        <span className="inline-flex items-center gap-1">
                          {player.expectedPoints.toFixed(1)}
                          {isEffectiveCaptain && (
                            <span className="rounded-pill bg-model-wash px-1 text-2xs font-bold text-model">
                              2×
                            </span>
                          )}
                        </span>
                      </Td>
                    </Tr>
                  )
                })}
              </TBody>
            </Table>
          </div>
        </Card>
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
