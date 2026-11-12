"use client"

import { useMemo, useState } from "react"
import { Trophy, Clock, Repeat, Wallet, Zap } from "lucide-react"

import type { SquadPlayer, ManagerSummary } from "@/lib/model"
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
import { Badge, PositionBadge, ClubBadge, CaptainBadge } from "@/components/ui/Badge"
import { SegmentedControl } from "@/components/ui/Button"
import { Pitch, type FormationSlot } from "@/components/my-team/Pitch"
import { ModelBadge } from "@/components/system/SourceBanner"

export function MyTeamView({
  squad,
  manager,
}: {
  squad: SquadPlayer[]
  manager: ManagerSummary | null
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

  // Team expected points, using the Sideline Quant model where present
  // and falling back to FPL's own figure otherwise.
  const expectedPoints = (player: SquadPlayer) =>
    player.sidelineQuantProjection?.expectedPoints ??
    player.fplProjection?.expectedPoints ??
    0

  const teamExpected = teamExpectedPoints(
    squad.map((player) => ({
      id: player.id,
      expectedPoints: player.expectedPoints,
    })),
    captain?.id
  )

  const latestPoints = manager?.eventPoints ?? 0
  const previousPoints = 0
  const totalPoints = manager?.totalPoints ?? 0
  const averagePoints = manager
    ? totalPoints / Math.max(1, manager.currentGameweek)
    : 0

  const benchOrder = ["GK", "DEF", "MID", "FWD"]
  const orderedSubstitutes = [...substitutes].sort(
    (a, b) => benchOrder.indexOf(a.position) - benchOrder.indexOf(b.position)
  )

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={manager?.name ?? "My Team"}
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
          meta={`Across ${manager?.currentGameweek ?? 0} gameweeks`}
          icon={<Clock className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Transfers made"
          value={manager?.totalTransfers ?? 0}
          meta="This season"
          icon={<Repeat className="h-4 w-4" strokeWidth={1.8} />}
        />
        <StatTile
          label="Money in bank"
          value={`£${manager?.bank ?? 0}m`}
          meta="Available to spend"
          icon={<Wallet className="h-4 w-4" strokeWidth={1.8} />}
        />
      </div>

      {/* Pitch + summary */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
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
              className="rounded-none border-0 border-t border-line"
            />
          </CardBody>
        </Card>

        <div className="grid gap-6 2xl:grid-cols-2">
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
                    +{(captain ? expectedPoints(captain) : 0).toFixed(1)} pts
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-secondary">Bench contribution</dt>
                  <dd data-numeric className="font-medium text-ink">
                    {substitutes
                      .reduce((sum, p) => sum + expectedPoints(p), 0)
                      .toFixed(1)}{" "}
                    pts
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2.5">
                  <dt className="text-ink-secondary">Team value</dt>
                  <dd data-numeric className="font-medium text-ink">
                    £{manager?.teamValue ?? 0}m
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
                    <ClubBadge code={player.clubAbbrev} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {player.webName}
                      </p>
                      <p className="text-xs text-ink-tertiary">
                        {player.position} · £
                        {(player.priceTenths / 10).toFixed(1)}m
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        data-numeric
                        className="text-sm font-semibold text-model"
                      >
                        {expectedPoints(player).toFixed(1)}
                      </p>
                      <p className="text-2xs uppercase tracking-wide text-ink-tertiary">
                        xPts
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Squad table */}
      <section>
        <SectionHeader
          title="Squad"
          description="All fifteen players with actual form and modelled projection"
          action={<ModelBadge />}
        />
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-subtle/50">
                  <Th className="pl-5">Player</Th>
                  <Th>Pos</Th>
                  <Th>Opponent</Th>
                  <Th align="right">Price</Th>
                  <Th align="right">Last GW</Th>
                  <Th align="right">Season</Th>
                  <Th align="right">Form</Th>
                  <Th align="right" className="pr-5">
                    xPts
                  </Th>
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
                    </td>
                    <td>
                      <PositionBadge position={player.position} />
                    </td>
                    <td className="text-ink-secondary">
                      {player.opponents.length > 0
                        ? player.opponents.join(" + ")
                        : "—"}
                      {player.fixtureCount > 1 && (
                        <Badge tone="caution" className="ml-1.5">
                          2 fixtures
                        </Badge>
                      )}
                    </td>
                    <td
                      data-numeric
                      className="text-right text-ink-secondary"
                    >
                      £{(player.priceTenths / 10).toFixed(1)}m
                    </td>
                    <td
                      data-numeric
                      className={cn(
                        "text-right font-medium",
                        player.lastGameweekPoints >= 6
                          ? "text-positive"
                          : player.lastGameweekPoints <= 2
                            ? "text-negative"
                            : "text-ink"
                      )}
                    >
                      {player.lastGameweekPoints}
                    </td>
                    <td
                      data-numeric
                      className="text-right text-ink-secondary"
                    >
                      {player.totalPoints}
                    </td>
                    <td
                      data-numeric
                      className="text-right text-ink-secondary"
                    >
                      {player.form.toFixed(1)}
                    </td>
                    <td
                      data-numeric
                      className="pr-5 text-right font-semibold text-model"
                    >
                      {expectedPoints(player).toFixed(1)}
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
        "py-2 pr-4 text-2xs font-semibold uppercase tracking-[0.09em] text-ink-tertiary",
        align === "right" ? "text-right" : "text-left",
        className
      )}
    >
      {children}
    </th>
  )
}
