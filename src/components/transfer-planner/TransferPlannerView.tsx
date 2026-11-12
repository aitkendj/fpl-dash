"use client"

import { useState } from "react"
import {
  Search,
  ArrowRight,
  Check,
  X,
  Trash2,
  AlertCircle,
  Info,
} from "lucide-react"

import type { DashboardPlayer, SquadPlayer } from "@/lib/model"
import {
  simulateTransfers,
  TRANSFER_COST_POINTS,
  type FplPlayer,
  type TransferProposal,
} from "@/lib/transfers"
import { cn } from "@/lib/utils"

import { Card, CardHeader, CardBody, PageHeader } from "@/components/ui/Card"
import { Badge, PositionBadge, ClubBadge } from "@/components/ui/Badge"
import { Button, Select } from "@/components/ui/Button"
import { DeltaText } from "@/components/ui/StatTile"
import { ModelBadge } from "@/components/system/SourceBanner"

export function TransferPlannerView({
  squad,
  players,
  manager,
}: {
  squad: SquadPlayer[]
  players: DashboardPlayer[]
  manager: { bank: number; teamValue: number } | null
}) {
  const [soldId, setSoldId] = useState<number | null>(null)
  const [boughtId, setBoughtId] = useState<number | null>(null)
  const [bank, setBank] = useState(manager?.bank ?? 0)
  const [freeTransfers, setFreeTransfers] = useState(2)
  const [search, setSearch] = useState("")
  const [position, setPosition] = useState("")
  const [club, setClub] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [draft, setDraft] = useState<TransferProposal[]>([])

  const squadIds = new Set(squad.map((player) => player.id))

  const sold = squad.find((player) => player.id === soldId) ?? null
  const bought = players.find((player) => player.id === boughtId) ?? null

  // ---- Proposals: staged draft plus the transfer being configured ----
  const proposals: TransferProposal[] = [
    ...draft,
    ...(sold && bought ? [{ soldId: sold.id, boughtId: bought.id }] : []),
  ]

  const pool: FplPlayer[] = [
    ...squad.map((player) => ({
      id: player.id,
      webName: player.webName,
      position: player.position,
      team: player.team,
      priceTenths: player.priceTenths,
      expectedPoints: player.expectedPoints,
      isCaptain: player.isCaptain,
      isViceCaptain: player.isViceCaptain,
    })),
    ...players.map((player) => ({
      id: player.id,
      webName: player.webName,
      position: player.position,
      team: player.team,
      priceTenths: player.priceTenths,
      expectedPoints: player.expectedPoints,
      isCaptain: false,
      isViceCaptain: false,
    })),
  ]

  const impact = simulateTransfers({
    squad: pool.slice(0, squad.length),
    pool,
    proposals,
    budget: { bank, freeTransfers },
  })

  const stagedSoldIds = new Set(draft.map((d) => d.soldId))
  const stagedBoughtIds = new Set(draft.map((d) => d.boughtId))

  const clubOptions = Array.from(new Set(players.map((p) => p.team)))
    .map((id) => ({
      value: String(id),
      label: players.find((p) => p.team === id)?.clubName ?? "",
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const candidates = players
    .filter((player) => {
      const term = search.trim().toLowerCase()
      const matchTerm =
        !term ||
        player.webName.toLowerCase().includes(term) ||
        player.clubName.toLowerCase().includes(term)
      const matchPos = !position || player.position === position
      const matchClub = !club || String(player.team) === club
      const matchPrice =
        !maxPrice || player.priceTenths / 10 <= Number(maxPrice)
      const notOwned =
        !squadIds.has(player.id) && !stagedBoughtIds.has(player.id)
      return matchTerm && matchPos && matchClub && matchPrice && notOwned
    })
    .sort(
      (a, b) =>
        (b.sidelineQuantProjection?.expectedPoints ?? 0) -
        (a.sidelineQuantProjection?.expectedPoints ?? 0)
    )

  const hasFilters = Boolean(search || position || club || maxPrice)

  const clearFilters = () => {
    setSearch("")
    setPosition("")
    setClub("")
    setMaxPrice("")
  }

  const resetSelection = () => {
    setSoldId(null)
    setBoughtId(null)
    clearFilters()
  }

  const addToDraft = () => {
    if (!sold || !bought) return
    const line = impact.perTransfer.find(
      (l) => l.soldId === sold.id && l.boughtId === bought.id
    )
    if (!line?.valid) return

    setDraft((prev) => [...prev, { soldId: sold.id, boughtId: bought.id }])
    resetSelection()
  }

  const removeFromDraft = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index))
  }

  const hasSelection = Boolean(sold && bought)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={manager ? `Budget £${manager.bank}m` : "Transfer Planner"}
        title="Transfer Planner"
        description="Model swaps, weigh the financial and expected-points impact, and stage them in a draft."
        action={<ModelBadge />}
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* ---------------- Step 1: sell ---------------- */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="1 · Sell"
              description="Choose a player to remove"
            />
            <CardBody className="p-0">
              <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
                {squad.map((player) => {
                  const isSelected = soldId === player.id
                  const isStaged = stagedSoldIds.has(player.id)
                  return (
                    <li key={player.id}>
                      <button
                        onClick={() => {
                          setSoldId(player.id)
                          setBoughtId(null)
                        }}
                        disabled={isStaged}
                        className={cn(
                          "flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors",
                          isStaged && "opacity-40",
                          isSelected
                            ? "bg-surface-sunken"
                            : "hover:bg-surface-subtle/60"
                        )}
                      >
                        <ClubBadge code={player.clubAbbrev} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {player.webName}
                          </span>
                          <span className="block text-xs text-ink-tertiary">
                            {player.position} · £
                            {(player.priceTenths / 10).toFixed(1)}m
                          </span>
                        </span>
                        {player.isCaptain && <Badge tone="inverse">C</Badge>}
                        {isStaged && <Badge tone="outline">Staged</Badge>}
                        {isSelected && !isStaged && (
                          <Check
                            className="h-4 w-4 shrink-0 text-ink"
                            strokeWidth={2.4}
                          />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </CardBody>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader title="Budget" />
            <CardBody className="space-y-4">
              <div>
                <label className="eyebrow mb-2 block" htmlFor="bank">
                  Money in the bank
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-tertiary">£</span>
                  <input
                    id="bank"
                    type="number"
                    step={0.5}
                    min={0}
                    value={bank}
                    onChange={(e) => setBank(Number(e.target.value) || 0)}
                    className="h-8.5 w-24 rounded-control border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                  <span className="text-sm text-ink-tertiary">m</span>
                </div>
              </div>

              <div>
                <label
                  className="eyebrow mb-2 block"
                  htmlFor="free-transfers"
                >
                  Free transfers remaining
                </label>
                <input
                  id="free-transfers"
                  type="number"
                  step={1}
                  min={0}
                  max={5}
                  value={freeTransfers}
                  onChange={(e) =>
                    setFreeTransfers(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="h-8.5 w-24 rounded-control border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <p className="border-t border-line pt-3 text-xs text-ink-tertiary">
                Each transfer beyond the free allowance costs{" "}
                {TRANSFER_COST_POINTS} points.
              </p>
            </CardBody>
          </Card>
        </div>

        {/* ---------------- Steps 2 & 3 ---------------- */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader
              title="2 · Buy"
              description={
                sold
                  ? `Replacing ${sold.webName} · £${(
                      sold.priceTenths / 10
                    ).toFixed(1)}m`
                  : "Select a player to sell first"
              }
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
                options={clubOptions}
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
            </div>

            {/* Candidates */}
            <div className="max-h-[420px] overflow-y-auto">
              {!sold ? (
                <div className="px-5 py-14 text-center">
                  <AlertCircle
                    className="mx-auto h-5 w-5 text-ink-tertiary"
                    strokeWidth={1.8}
                  />
                  <p className="mt-2.5 text-sm text-ink-secondary">
                    Choose a player to sell to see replacements.
                  </p>
                </div>
              ) : candidates.length === 0 ? (
                <div className="px-5 py-14 text-center text-sm text-ink-tertiary">
                  No players match these filters.
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {candidates.map((player) => {
                    const isSelected = boughtId === player.id
                    const diff =
                      (player.sidelineQuantProjection?.expectedPoints ?? 0) -
                      (sold.sidelineQuantProjection?.expectedPoints ?? 0)
                    return (
                      <li key={player.id}>
                        <button
                          onClick={() => setBoughtId(player.id)}
                          className={cn(
                            "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors",
                            isSelected
                              ? "bg-surface-sunken"
                              : "hover:bg-surface-subtle/60"
                          )}
                        >
                          <ClubBadge code={player.clubAbbrev} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-ink">
                                {player.webName}
                              </span>
                              <PositionBadge position={player.position} />
                            </span>
                            <span className="mt-0.5 block text-xs text-ink-tertiary">
                              {player.opponents.length > 0
                                ? `vs ${player.opponents.join(" + ")}`
                                : "no fixture"}{" "}
                              · £{(player.priceTenths / 10).toFixed(1)}m ·{" "}
                              {player.sidelineQuantProjection?.expectedMinutes ??
                                "—"}{" "}
                              ′ xPts
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span
                              data-numeric
                              className="block text-sm font-semibold text-model"
                            >
                              {(
                                player.sidelineQuantProjection
                                  ?.expectedPoints ?? 0
                              ).toFixed(1)}
                            </span>
                            <DeltaText value={diff} className="text-xs" />
                          </span>
                          {isSelected && (
                            <Check
                              className="h-4 w-4 shrink-0 text-ink"
                              strokeWidth={2.4}
                            />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </Card>

          {/* ---------------- Impact ---------------- */}
          {(hasSelection || draft.length > 0) && (
            <Card>
              <CardHeader
                title="3 · Impact"
                description={
                  draft.length > 0
                    ? `${draft.length} staged transfer${
                        draft.length === 1 ? "" : "s"
                      }${hasSelection ? " + 1 being configured" : ""}, simulated together`
                    : "Financial and expected-points effect of this swap"
                }
                action={
                  hasSelection ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={addToDraft}
                      disabled={
                        !impact.perTransfer.find(
                          (l) => l.soldId === soldId && l.boughtId === boughtId
                        )?.valid
                      }
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                      Add to draft
                    </Button>
                  ) : undefined
                }
              />
              <CardBody>
                {impact.warnings.length > 0 && (
                  <div className="mb-5 space-y-2">
                    {impact.warnings.map((warning, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 rounded-control border border-caution/20 bg-caution-wash px-3 py-2.5 text-sm text-caution"
                      >
                        <Info
                          className="mt-0.5 h-4 w-4 shrink-0"
                          strokeWidth={2}
                        />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Transfers list */}
                  <div>
                    <p className="eyebrow mb-3">Transfers</p>
                    <ul className="space-y-2">
                      {impact.perTransfer.map((line, index) => (
                        <li
                          key={`${line.soldId}-${line.boughtId}-${index}`}
                          className={cn(
                            "flex items-center gap-3 rounded-control border px-3 py-2.5",
                            line.valid
                              ? "border-line bg-surface"
                              : "border-negative/25 bg-negative-wash"
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-sm">
                              <span className="truncate text-ink-secondary line-through decoration-ink-tertiary">
                                {line.soldName}
                              </span>
                              <ArrowRight
                                className="h-3 w-3 shrink-0 text-ink-tertiary"
                                strokeWidth={2}
                              />
                              <span className="truncate font-medium text-ink">
                                {line.boughtName}
                              </span>
                            </span>
                            <span className="mt-0.5 block text-xs text-ink-tertiary">
                              {line.valid
                                ? `£${line.soldPrice.toFixed(1)}m → £${line.boughtPrice.toFixed(1)}m`
                                : line.reason}
                            </span>
                          </span>
                          {line.valid && (
                            <DeltaText value={line.epsDelta} />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Totals */}
                  <div className="space-y-5">
                    <div>
                      <p className="eyebrow mb-3">Money</p>
                      <dl className="space-y-2 text-sm">
                        <ImpactRow
                          label="In the bank"
                          value={`£${impact.bankBefore.toFixed(1)}m`}
                        />
                        <ImpactRow
                          label="After transfers"
                          value={`£${impact.bankAfter.toFixed(1)}m`}
                          good={impact.moneyDelta >= 0}
                        />
                        <ImpactRow
                          label="Transfer penalty"
                          value={
                            impact.transferCostPoints > 0
                              ? `-${impact.transferCostPoints} pts`
                              : "Free"
                          }
                          good={impact.transferCostPoints === 0}
                        />
                        <ImpactRow
                          label="Free transfers used"
                          value={`${impact.freeTransfersUsed} of ${freeTransfers}`}
                        />
                      </dl>
                    </div>

                    <div className="border-t border-line pt-4">
                      <p className="eyebrow mb-3">Expected points</p>
                      <dl className="space-y-2 text-sm">
                        <ImpactRow
                          label="Before"
                          value={impact.teamEpsBefore.toFixed(1)}
                        />
                        <ImpactRow
                          label="After"
                          value={impact.teamEpsAfter.toFixed(1)}
                        />
                        <div className="flex items-center justify-between pt-1">
                          <dt className="font-medium text-ink">Change</dt>
                          <dd>
                            <DeltaText value={impact.epsDelta} showIcon />
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="border-t border-line pt-4">
                      <p className="eyebrow mb-3">Captaincy after</p>
                      <div className="flex flex-wrap gap-2">
                        {impact.captain && (
                          <Badge tone="inverse">
                            C · {impact.captain.webName}
                          </Badge>
                        )}
                        {impact.viceCaptain && (
                          <Badge tone="outline">
                            VC · {impact.viceCaptain.webName}
                          </Badge>
                        )}
                        {!impact.captain && (
                          <span className="text-sm text-ink-tertiary">
                            No captain assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* ---------------- Draft ---------------- */}
          <Card>
            <CardHeader
              title="Draft"
              description={
                draft.length === 0
                  ? "No transfers staged yet"
                  : `${draft.length} transfer${
                      draft.length === 1 ? "" : "s"
                    } staged — simulated together above`
              }
              action={
                draft.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDraft([])}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Clear
                  </Button>
                ) : undefined
              }
            />
            <CardBody className="p-0">
              {draft.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-ink-tertiary">
                  Stage a swap to build your transfer list.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {draft.map((transfer, index) => {
                    const line = impact.perTransfer.find(
                      (l) =>
                        l.soldId === transfer.soldId &&
                        l.boughtId === transfer.boughtId
                    )
                    const soldPlayer = squad.find(
                      (p) => p.id === transfer.soldId
                    )
                    const boughtPlayer = players.find(
                      (p) => p.id === transfer.boughtId
                    )
                    return (
                      <li
                        key={`${transfer.soldId}-${transfer.boughtId}-${index}`}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <ClubBadge
                          code={boughtPlayer?.clubAbbrev ?? "???"}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-ink">
                            <span className="line-through decoration-ink-tertiary">
                              {soldPlayer?.webName}
                            </span>
                            <ArrowRight
                              className="mx-1.5 inline h-3 w-3 text-ink-tertiary"
                              strokeWidth={2}
                            />
                            <span className="font-medium">
                              {boughtPlayer?.webName}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-ink-tertiary">
                            £{line?.soldPrice.toFixed(1)}m → £
                            {line?.boughtPrice.toFixed(1)}m
                          </p>
                        </div>
                        {line && <DeltaText value={line.epsDelta} />}
                        <button
                          onClick={() => removeFromDraft(index)}
                          className="rounded p-1 text-ink-tertiary transition-colors hover:bg-surface-subtle hover:text-negative"
                          aria-label="Remove transfer"
                        >
                          <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ImpactRow({
  label,
  value,
  good,
}: {
  label: string
  value: string
  good?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-secondary">{label}</dt>
      <dd
        data-numeric
        className={cn(
          "font-medium",
          good === undefined
            ? "text-ink"
            : good
              ? "text-positive"
              : "text-negative"
        )}
      >
        {value}
      </dd>
    </div>
  )
}
