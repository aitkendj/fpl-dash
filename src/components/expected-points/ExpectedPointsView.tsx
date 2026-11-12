"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"

import type { DashboardPlayer, SquadPlayer, FPLPosition } from "@/lib/model"
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
import {
  Table,
  THead,
  TBody,
  Th,
  Td,
  Tr,
  SortableTh,
} from "@/components/ui/Table"
import { ModelBadge, OfficialBadge } from "@/components/system/SourceBanner"

type SortKey = "sidelinequant" | "fpl" | "price" | "minutes" | "name"

const POSITIONS: {
  position: FPLPosition
  title: string
  description: string
}[] = [
  {
    position: "GK",
    title: "Goalkeepers",
    description: "Two goalkeepers in the squad",
  },
  {
    position: "DEF",
    title: "Defenders",
    description: "Five defenders in the squad",
  },
  {
    position: "MID",
    title: "Midfielders",
    description: "Five midfielders in the squad",
  },
  {
    position: "FWD",
    title: "Attackers",
    description: "Three attackers in the squad",
  },
]

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
  const [club, setClub] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minExpected, setMinExpected] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("sidelinequant")
  const [sortAsc, setSortAsc] = useState(false)

  const captain = squad.find((p) => p.isCaptain)

  const teamExpected = squad.reduce((sum, player) => {
    const multiplier = player.isCaptain ? 2 : 1
    return sum + player.expectedPoints * multiplier
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
      const matchClub = !club || String(player.team) === club
      const matchPrice =
        !maxPrice || player.priceTenths / 10 <= Number(maxPrice)
      const matchMin =
        !minExpected || player.expectedPoints >= Number(minExpected)

      return matchTerm && matchClub && matchPrice && matchMin
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
          diff = a.expectedPoints - b.expectedPoints
      }
      return sortAsc ? diff : -diff
    })
  }, [players, search, club, maxPrice, minExpected, sortKey, sortAsc])

  const hasFilters = Boolean(search || club || maxPrice || minExpected)

  const clearFilters = () => {
    setSearch("")
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
        description="Projected output for the next gameweek, split by position."
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
                <Row label="Captain" value={captain?.webName ?? "—"} />
                <Row
                  label="Captain bonus"
                  value={`+${(captain?.expectedPoints ?? 0).toFixed(1)} pts`}
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
                    .reduce((sum, p) => sum + p.expectedPoints, 0)
                    .toFixed(1)} pts`}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[620px]">
                <THead>
                  <tr>
                    <Th className="pl-6">Player</Th>
                    <Th align="center">Opponent</Th>
                    <Th align="center">Price</Th>
                    <Th align="center">xMins</Th>
                    <Th align="center">Start</Th>
                    <Th align="center" className="pr-6">
                      xPts
                    </Th>
                  </tr>
                </THead>
                <TBody>
                  {squad.map((player) => {
                    const projection = player.sidelineQuantProjection
                    return (
                      <Tr key={player.id}>
                        <Td className="pl-6">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink">
                              {player.webName}
                            </span>
                            <PositionBadge position={player.position} />
                            {player.isCaptain && (
                              <Badge tone="inverse">C</Badge>
                            )}
                          </div>
                        </Td>
                        <Td align="center" className="text-ink-secondary">
                          {player.opponents.length > 0
                            ? player.opponents.join(" + ")
                            : "—"}
                        </Td>
                        <Td align="center" numeric>
                          £{(player.priceTenths / 10).toFixed(1)}m
                        </Td>
                        <Td align="center" numeric>
                          {projection?.expectedMinutes ?? "—"}
                        </Td>
                        <Td align="center" numeric>
                          {projection?.startProbability !== undefined
                            ? `${Math.round(projection.startProbability * 100)}%`
                            : "—"}
                        </Td>
                        <Td
                          align="center"
                          numeric
                          className="pr-6 font-semibold text-model"
                        >
                          {player.expectedPoints.toFixed(1)}
                        </Td>
                      </Tr>
                    )
                  })}
                </TBody>
              </Table>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card className="overflow-hidden">
        <div className="grid gap-3 px-5 py-3.5 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="flex items-center justify-between border-t border-line px-5 py-2">
            <span className="text-xs text-ink-tertiary">Filters applied</span>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              Clear
            </Button>
          </div>
        )}
      </Card>

      {/* Position tables */}
      {POSITIONS.map(({ position, title, description }) => {
        const rows = filtered.filter((player) => player.position === position)

        return (
          <section key={position}>
            <SectionHeader
              title={title}
              description={`${rows.length} player${rows.length === 1 ? "" : "s"} · ${description}`}
              action={<ModelBadge />}
            />
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[860px]">
                  <THead>
                    <tr>
                      <SortableTh
                        className="pl-5"
                        active={sortKey === "name"}
                        asc={sortAsc}
                        onClick={() => toggleSort("name")}
                      >
                        Player
                      </SortableTh>
                      <Th align="center">Club</Th>
                      <SortableTh
                        align="center"
                        active={sortKey === "sidelinequant"}
                        asc={sortAsc}
                        onClick={() => toggleSort("sidelinequant")}
                      >
                        xPts
                      </SortableTh>
                      <SortableTh
                        align="center"
                        active={sortKey === "fpl"}
                        asc={sortAsc}
                        onClick={() => toggleSort("fpl")}
                      >
                        FPL xPts
                      </SortableTh>
                      <SortableTh
                        align="center"
                        active={sortKey === "minutes"}
                        asc={sortAsc}
                        onClick={() => toggleSort("minutes")}
                      >
                        xMins
                      </SortableTh>
                      <Th align="center">Start</Th>
                      <Th className="pr-5">Fixture</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {rows.map((player) => {
                      const projection = player.sidelineQuantProjection
                      const inSquad = squadIds.has(player.id)
                      return (
                        <Tr
                          key={player.id}
                          className={cn(
                            inSquad && "bg-positive-wash/30"
                          )}
                        >
                          <Td className="pl-5">
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
                          </Td>
                          <Td align="center">
                            <span className="inline-flex items-center gap-2 text-ink-secondary">
                              <ClubBadge code={player.clubAbbrev} />
                            </span>
                          </Td>
                          <Td
                            align="center"
                            numeric
                            className="font-semibold text-model"
                          >
                            {player.expectedPoints.toFixed(1)}
                          </Td>
                          <Td align="center" numeric>
                            {player.fplProjection?.expectedPoints?.toFixed(1) ??
                              "—"}
                          </Td>
                          <Td align="center" numeric>
                            {projection?.expectedMinutes ?? "—"}
                          </Td>
                          <Td align="center" numeric>
                            {projection?.startProbability !== undefined
                              ? `${Math.round(projection.startProbability * 100)}%`
                              : "—"}
                          </Td>
                          <Td className="pr-5 text-ink-secondary">
                            {player.opponents.length > 0
                              ? player.opponents.join(" + ")
                              : "—"}
                            {player.fixtureCount > 1 && (
                              <Badge tone="caution" className="ml-1.5">
                                DGW
                              </Badge>
                            )}
                          </Td>
                        </Tr>
                      )
                    })}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-12 text-center text-sm text-ink-tertiary"
                        >
                          No {title.toLowerCase()} match these filters.
                        </td>
                      </tr>
                    )}
                  </TBody>
                </Table>
              </div>
            </Card>
          </section>
        )
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-2xs text-ink-tertiary">
          xPts from{" "}
          <span className="font-medium text-model">model</span> projections ·
          FPL xPts from{" "}
          <span className="font-medium text-ink-secondary">official</span> FPL
          figures
        </p>
        <div className="flex items-center gap-3">
          <OfficialBadge />
          <ModelBadge />
        </div>
      </div>
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
