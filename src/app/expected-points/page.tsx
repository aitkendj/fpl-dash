"use client"

import { useState } from "react"
import { Search, ArrowUpDown, X } from "lucide-react"

import { getDashboardData } from "@/data/provider"
import { calculateTeamExpectedPoints } from "@/lib/calculations"
import { cn, formatPrice } from "@/lib/utils"

import { Card, CardHeader, CardBody, PageHeader } from "@/components/ui/Card"
import { Badge, PositionBadge, ClubBadge } from "@/components/ui/Badge"
import { Select, Button } from "@/components/ui/Button"

type SortKey = "expected_points" | "price" | "minutes" | "name"

export default function ExpectedPointsPage() {
  const [search, setSearch] = useState("")
  const [position, setPosition] = useState("")
  const [club, setClub] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("expected_points")
  const [sortAsc, setSortAsc] = useState(false)

  const data = getDashboardData()
  const { squad, market: MARKET_PLAYERS, clubNames: PL_TEAM_NAMES, clubAbbrevs: PL_TEAM_ABBREV, teamId: FPL_TEAM_ID } = data

  const CLUB_OPTIONS = Array.from(
    new Set([...squad.map((p) => p.team), ...MARKET_PLAYERS.map((p) => p.team)])
  )
    .map((id) => ({ value: String(id), label: PL_TEAM_NAMES[id] }))
    .sort((a, b) => a.label.localeCompare(b.label))
  const captain = squad.find((p) => p.is_captain)
  const teamExpectedPoints = calculateTeamExpectedPoints(squad, captain?.id)

  const filtered = (() => {
    const term = search.trim().toLowerCase()

    const rows = MARKET_PLAYERS.filter((p) => {
      const matchTerm =
        !term ||
        p.web_name.toLowerCase().includes(term) ||
        PL_TEAM_NAMES[p.team].toLowerCase().includes(term)
      const matchPos = !position || p.position === position
      const matchClub = !club || String(p.team) === club
      const matchPrice =
        !maxPrice || p.now_price / 10 <= Number(maxPrice)

      return matchTerm && matchPos && matchClub && matchPrice
    })

    return rows.sort((a, b) => {
      let diff = 0
      switch (sortKey) {
        case "price":
          diff = a.now_price - b.now_price
          break
        case "minutes":
          diff = a.expected_minutes - b.expected_minutes
          break
        case "name":
          diff = a.web_name.localeCompare(b.web_name)
          break
        default:
          diff = a.expected_points - b.expected_points
      }
      return sortAsc ? diff : -diff
    })
  })()

  const hasFilters = Boolean(search || position || club || maxPrice)

  const clearFilters = () => {
    setSearch("")
    setPosition("")
    setClub("")
    setMaxPrice("")
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
    <div className="animate-rise space-y-8">
      <PageHeader
        eyebrow={`Team ${FPL_TEAM_ID}`}
        title="Expected Points"
        description="Projected output for the next gameweek across your squad and the wider player pool."
      />

      {/* Squad projection */}
      <Card>
        <CardHeader
          title="My team"
          description="Projected return with captaincy weighting applied"
        />
        <CardBody className="p-0">
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* Headline figure */}
            <div className="border-b border-line p-6 lg:border-b-0 lg:border-r">
              <p className="eyebrow">Total expected</p>
              <p className="display-numeral mt-2 text-6xl text-ink">
                {teamExpectedPoints.toFixed(1)}
              </p>
              <p className="mt-2 text-sm text-ink-tertiary">
                points across {squad.length} players
              </p>

              <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                <Row
                  label="Captain bonus"
                  value={`+${((captain?.expected_points ?? 0)).toFixed(1)}`}
                  tone="positive"
                />
                <Row
                  label="Squad average"
                  value={(teamExpectedPoints / squad.length).toFixed(1)}
                />
                <Row label="Bench share" value="11.2 pts" />
              </div>
            </div>

            {/* Squad list */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-subtle/40">
                    <Th className="pl-6">Player</Th>
                    <Th>Opponent</Th>
                    <Th align="right">Price</Th>
                    <Th align="right">xMins</Th>
                    <Th align="right" className="pr-6">
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
                      <td className="pl-6 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-medium text-ink">
                            {player.web_name}
                          </span>
                          <PositionBadge position={player.position} />
                          {player.is_captain && (
                            <Badge tone="inverse">C</Badge>
                          )}
                        </div>
                      </td>
                      <td className="text-ink-secondary">
                        {PL_TEAM_NAMES[player.opposition ?? 1]}
                      </td>
                      <td
                        data-numeric
                        className="text-right text-ink-secondary"
                      >
                        {formatPrice(player.now_price)}
                      </td>
                      <td
                        data-numeric
                        className="text-right text-ink-secondary"
                      >
                        {player.expected_minutes}
                      </td>
                      <td
                        data-numeric
                        className="pr-6 text-right font-semibold text-ink"
                      >
                        {player.expected_points.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Market table */}
      <Card className="overflow-hidden">
        <CardHeader
          title="All players"
          description={`${filtered.length} of ${MARKET_PLAYERS.length} players`}
          action={
            hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" strokeWidth={2} />
                Clear
              </Button>
            ) : undefined
          }
        />

        {/* Filters */}
        <div className="grid gap-3 border-b border-line bg-surface-subtle/30 px-5 py-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search player or club…"
          />
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
            options={CLUB_OPTIONS}
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
              { value: "10.0", label: "Up to £10.0m" },
              { value: "12.0", label: "Up to £12.0m" },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
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
                  active={sortKey === "expected_points"}
                  asc={sortAsc}
                  onClick={() => toggleSort("expected_points")}
                >
                  xPts
                </SortableTh>
                <SortableTh
                  align="right"
                  active={sortKey === "minutes"}
                  asc={sortAsc}
                  onClick={() => toggleSort("minutes")}
                >
                  xMins
                </SortableTh>
                <Th className="pr-5">Fixture</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((player) => (
                <tr
                  key={player.id}
                  className="transition-colors hover:bg-surface-subtle/40"
                >
                  <td className="pl-5 py-2.5 font-medium text-ink">
                    {player.web_name}
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-2 text-ink-secondary">
                      <ClubBadge code={PL_TEAM_ABBREV[player.team]} />
                    </span>
                  </td>
                  <td>
                    <PositionBadge position={player.position} />
                  </td>
                  <td
                    data-numeric
                    className="text-right text-ink-secondary"
                  >
                    {formatPrice(player.now_price)}
                  </td>
                  <td
                    data-numeric
                    className="text-right font-semibold text-ink"
                  >
                    {player.expected_points.toFixed(1)}
                  </td>
                  <td
                    data-numeric
                    className="text-right text-ink-secondary"
                  >
                    {player.expected_minutes}
                  </td>
                  <td className="pr-5 text-ink-secondary">
                    vs {PL_TEAM_NAMES[player.opposition]}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-ink-tertiary"
                  >
                    No players match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
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

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-tertiary"
        strokeWidth={2}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8.5 w-full rounded-control border border-line-strong bg-surface pl-8.5 pr-3 text-sm text-ink placeholder:text-ink-tertiary focus:border-ink focus:outline-none"
      />
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
