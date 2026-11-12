"use client"

import { useMemo, useState } from "react"
import { Search, ArrowUpDown, X } from "lucide-react"

import type { DashboardPlayer, SquadPlayer } from "@/lib/model"
import { cn } from "@/lib/utils"

import {
  Card,
  CardHeader,
  CardBody,
  SectionHeader,
  PageHeader,
} from "@/components/ui/Card"
import { Badge, PositionBadge, ClubBadge } from "@/components/ui/Badge"
import { Button, Select } from "@/components/ui/Button"
import { ModelBadge, OfficialBadge } from "@/components/system/SourceBanner"

type SortKey = "sidelinequant" | "fpl" | "price" | "minutes" | "name"

export function ExpectedPointsView({
  squad,
  players,
  projectionGameweek,
}: {
  squad: SquadPlayer[]
  players: DashboardPlayer[]
  projectionGameweek: number | null
}) {
  const [search, setSearch] = useState("")
  const [position, setPosition] = useState("")
  const [club, setClub] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("sidelinequant")
  const [sortAsc, setSortAsc] = useState(false)
  const [minExpected, setMinExpected] = useState("")

  const captain = squad.find((p) => p.isCaptain)

  const teamExpected = squad.reduce((sum, player) => {
    const points =
      player.sidelineQuantProjection?.expectedPoints ??
      player.fplProjection?.expectedPoints ??
      0
    const multiplier = player.isCaptain ? 2 : 1
    return sum + points * multiplier
  }, 0)

  const clubs = useMemo(() => {
    const ids = Array.from(new Set(players.map((p) => p.team)))
    return ids
      .map((id) => ({
        value: String(id),
        label: players.find((p) => p.team === id)?.clubName ?? "",
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [players])

  const squadIds = useMemo(
    () => new Set(squad.map((player) => player.id)),
    [squad]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    const rows = players.filter((player) => {
      const matchTerm =
        !term ||
        player.webName.toLowerCase().includes(term) ||
        player.clubName.toLowerCase().includes(term)
      const matchPos = !position || player.position === position
      const matchClub = !club || String(player.team) === club
      const matchPrice =
        !maxPrice || player.priceTenths / 10 <= Number(maxPrice)
      const sqPoints =
        player.sidelineQuantProjection?.expectedPoints ?? 0
      const matchMin =
        !minExpected || sqPoints >= Number(minExpected)

      return (
        matchTerm && matchPos && matchClub && matchPrice && matchMin
      )
    })

    return rows.sort((a, b) => {
      let diff = 0
      switch (sortKey) {
        case "fpl":
          diff =
            (a.fplProjection?.expectedPoints ?? 0) -
            (b.fplProjection?.expectedPoints ?? 0)
          break
        case "price":
          diff = a.priceTenths - b.priceTenths
          break
        case "minutes":
          diff =
            (a.sidelineQuantProjection?.expectedMinutes ?? 0) -
            (b.sidelineQuantProjection?.expectedMinutes ?? 0)
          break
        case "name":
          diff = a.webName.localeCompare(b.webName)
          break
        default:
          diff =
            (a.sidelineQuantProjection?.expectedPoints ?? 0) -
            (b.sidelineQuantProjection?.expectedPoints ?? 0)
      }
      return sortAsc ? diff : -diff
    })
  }, [players, search, position, club, maxPrice, minExpected, sortKey, sortAsc])

  const hasFilters = Boolean(search || position || club || maxPrice || minExpected)

  const clearFilters = () => {
    setSearch("")
    setPosition("")
    setClub("")
    setMaxPrice("")
    setMinExpected("")
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v)
    } else {
      setSortKey(key)
      setSortAsc(key === "name")
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Gameweek ${projectionGameweek ?? "—"} projections`}
        title="Expected Points"
        description="Projected output for the next gameweek across your squad and the wider player pool."
        action={<ModelBadge />}
      />

      {/* Squad projection */}
      <Card>
        <CardHeader
          title="My team"
          description="Projected return with captaincy weighting applied"
          action={<ModelBadge />}
        />
        <CardBody className="p-0">
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="border-b border-line p-6 lg:border-b-0 lg:border-r">
              <p className="eyebrow">Total expected</p>
              <p className="display-numeral mt-2 text-6xl text-ink">
                {teamExpected.toFixed(1)}
              </p>
              <p className="mt-2 text-sm text-ink-tertiary">
                points across {squad.length} players
              </p>

              <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                <Row
                  label="Captain"
                  value={captain?.webName ?? "—"}
                />
                <Row
                  label="Captain bonus"
                  value={`+${(
                    (captain?.sidelineQuantProjection?.expectedPoints ??
                      captain?.fplProjection?.expectedPoints ??
                      0)
                  ).toFixed(1)} pts`}
                  tone="positive"
                />
                <Row
                  label="Squad average"
                  value={(teamExpected / Math.max(1, squad.length)).toFixed(1)}
                />
                <Row
                  label="Bench share"
                  value={`${squad
                    .filter((p) => p.isSubstitute)
                    .reduce(
                      (sum, p) =>
                        sum +
                        (p.sidelineQuantProjection?.expectedPoints ?? 0),
                      0
                    )
                    .toFixed(1)} pts`}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-subtle/40">
                    <Th className="pl-6">Player</Th>
                    <Th>Opponent</Th>
                    <Th align="right">Price</Th>
                    <Th align="right">xMins</Th>
                    <Th align="right">Start</Th>
                    <Th align="right" className="pr-6">
                      xPts
                    </Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {squad.map((player) => {
                    const projection = player.sidelineQuantProjection
                    return (
                      <tr
                        key={player.id}
                        className="transition-colors hover:bg-surface-subtle/40"
                      >
                        <td className="pl-6 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink">
                              {player.webName}
                            </span>
                            <PositionBadge position={player.position} />
                            {player.isCaptain && (
                              <Badge tone="inverse">C</Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-ink-secondary">
                          {player.opponents.length > 0
                            ? player.opponents.join(" + ")
                            : "—"}
                        </td>
                        <td
                          data-numeric
                          className="text-right text-ink-secondary"
                        >
                          £{(player.priceTenths / 10).toFixed(1)}m
                        </td>
                        <td
                          data-numeric
                          className="text-right text-ink-secondary"
                        >
                          {projection?.expectedMinutes ?? "—"}
                        </td>
                        <td
                          data-numeric
                          className="text-right text-ink-secondary"
                        >
                          {projection?.startProbability !== undefined
                            ? `${Math.round(projection.startProbability * 100)}%`
                            : "—"}
                        </td>
                        <td
                          data-numeric
                          className="pr-6 text-right font-semibold text-model"
                        >
                          {(
                            projection?.expectedPoints ??
                            player.fplProjection?.expectedPoints ??
                            0
                          ).toFixed(1)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Market table */}
      <section>
        <SectionHeader
          title="All players"
          description={`${filtered.length} of ${players.length} players`}
          action={<ModelBadge />}
        />
        <Card className="overflow-hidden">
          {/* Filters */}
          <div className="grid gap-3 border-b border-line bg-surface-subtle/30 px-5 py-3.5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-tertiary"
                strokeWidth={2}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search player or club…"
                className="h-8.5 w-full rounded-control border border-line-strong bg-surface pl-8.5 pr-3 text-sm text-ink placeholder:text-ink-tertiary focus:border-ink focus:outline-none"
              />
            </div>
            <Select
              value={position}
              onValueChange={setPosition}
              placeholder="All positions"
              options={[
                { value: "GK", label: "Goalkeeper" },
                { value: "DEF", label: "Defender" },
                { value: "MID", label: "Midfielder" },
                { value: "FWD", label: "Forward" },
              ]}
            />
            <Select
              value={club}
              onValueChange={setClub}
              placeholder="All clubs"
              options={clubs}
            />
            <Select
              value={maxPrice}
              onValueChange={setMaxPrice}
              placeholder="Any price"
              options={[
                { value: "5.0", label: "Up to £5.0m" },
                { value: "6.0", label: "Up to £6.0m" },
                { value: "7.0", label: "Up to £7.0m" },
                { value: "8.0", label: "Up to £8.0m" },
                { value: "9.0", label: "Up to £9.0m" },
                { value: "12.0", label: "Up to £12.0m" },
              ]}
            />
            <Select
              value={minExpected}
              onValueChange={setMinExpected}
              placeholder="Any xPts"
              options={[
                { value: "1", label: "1+ xPts" },
                { value: "2", label: "2+ xPts" },
                { value: "3", label: "3+ xPts" },
                { value: "4", label: "4+ xPts" },
                { value: "5", label: "5+ xPts" },
                { value: "6", label: "6+ xPts" },
              ]}
            />
          </div>

          {hasFilters && (
            <div className="flex items-center justify-between border-b border-line px-5 py-2">
              <span className="text-xs text-ink-tertiary">
                Filters applied
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" strokeWidth={2} />
                Clear
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  <SortableTh
                    className="pl-5"
                    active={sortKey === "name"}
                    asc={sortAsc}
                    onClick={() => toggleSort("name")}
                  >
                    Player
                  </SortableTh>
                  <Th>Club</Th>
                  <Th>Pos</Th>
                  <SortableTh
                    align="right"
                    active={sortKey === "price"}
                    asc={sortAsc}
                    onClick={() => toggleSort("price")}
                  >
                    Price
                  </SortableTh>
                  <SortableTh
                    align="right"
                    active={sortKey === "sidelinequant"}
                    asc={sortAsc}
                    onClick={() => toggleSort("sidelinequant")}
                  >
                    xPts
                  </SortableTh>
                  <SortableTh
                    align="right"
                    active={sortKey === "fpl"}
                    asc={sortAsc}
                    onClick={() => toggleSort("fpl")}
                  >
                    FPL xPts
                  </SortableTh>
                  <SortableTh
                    align="right"
                    active={sortKey === "minutes"}
                    asc={sortAsc}
                    onClick={() => toggleSort("minutes")}
                  >
                    xMins
                  </SortableTh>
                  <Th align="right">Start</Th>
                  <Th align="right">Range</Th>
                  <Th className="pr-5">Fixture</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((player) => {
                  const projection = player.sidelineQuantProjection
                  const inSquad = squadIds.has(player.id)
                  return (
                    <tr
                      key={player.id}
                      className={cn(
                        "transition-colors hover:bg-surface-subtle/40",
                        inSquad && "bg-positive-wash/30"
                      )}
                    >
                      <td className="pl-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">
                            {player.webName}
                          </span>
                          {inSquad && <Badge tone="positive">Squad</Badge>}
                          {player.status !== "a" && (
                            <Badge tone="negative">
                              {player.status === "i"
                                ? "Injured"
                                : player.status === "d"
                                  ? "Doubtful"
                                  : player.status === "s"
                                    ? "Suspended"
                                    : "Unknown"}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-2 text-ink-secondary">
                          <ClubBadge code={player.clubAbbrev} />
                        </span>
                      </td>
                      <td>
                        <PositionBadge position={player.position} />
                      </td>
                      <td
                        data-numeric
                        className="text-right text-ink-secondary"
                      >
                        £{(player.priceTenths / 10).toFixed(1)}m
                      </td>
                      <td
                        data-numeric
                        className="text-right font-semibold text-model"
                      >
                        {(
                          projection?.expectedPoints ??
                          player.fplProjection?.expectedPoints ??
                          0
                        ).toFixed(1)}
                      </td>
                      <td
                        data-numeric
                        className="text-right text-ink-secondary"
                      >
                        {player.fplProjection?.expectedPoints?.toFixed(1) ?? "—"}
                      </td>
                      <td
                        data-numeric
                        className="text-right text-ink-secondary"
                      >
                        {projection?.expectedMinutes ?? "—"}
                      </td>
                      <td
                        data-numeric
                        className="text-right text-ink-secondary"
                      >
                        {projection?.startProbability !== undefined
                          ? `${Math.round(projection.startProbability * 100)}%`
                          : "—"}
                      </td>
                      <td
                        data-numeric
                        className="text-right text-ink-tertiary"
                      >
                        {projection
                          ? `${projection.floor}–${projection.ceiling}`
                          : "—"}
                      </td>
                      <td className="pr-5 text-ink-secondary">
                        {player.opponents.length > 0
                          ? player.opponents.join(" + ")
                          : "—"}
                        {player.fixtureCount > 1 && (
                          <Badge tone="caution" className="ml-1.5">
                            DGW
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-5 py-12 text-center text-sm text-ink-tertiary"
                    >
                      No players match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
            <p className="text-2xs text-ink-tertiary">
              xPts from{" "}
              <span className="font-medium text-model">model</span>{" "}
              projections · FPL xPts from{" "}
              <span className="font-medium text-ink-secondary">official</span>{" "}
              FPL figures
            </p>
            <div className="flex items-center gap-3">
              <OfficialBadge />
              <ModelBadge />
            </div>
          </div>
        </Card>
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
    <div className="flex items-center justify-between">
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

function SortableTh({
  children,
  onClick,
  active,
  asc,
  align = "left",
  className,
}: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  asc: boolean
  align?: "left" | "right"
  className?: string
}) {
  return (
    <th
      scope="col"
      className={cn(
        "py-2 pr-4 text-2xs font-semibold uppercase tracking-[0.09em]",
        align === "right" ? "text-right" : "text-left",
        className
      )}
    >
      <button
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-ink",
          active ? "text-ink" : "text-ink-tertiary"
        )}
      >
        {children}
        <ArrowUpDown
          className={cn(
            "h-3 w-3 transition-opacity",
            active ? "opacity-100" : "opacity-0"
          )}
          strokeWidth={2}
          style={{
            transform: active && asc ? "rotate(180deg)" : undefined,
          }}
        />
      </button>
    </th>
  )
}
