"use client"

import { useState } from "react"
import {
  Zap,
  Check,
  Activity,
} from "lucide-react"

import {
  Card,
  CardHeader,
  CardBody,
  SectionHeader,
  PageHeader,
} from "@/components/ui/Card"
import { StatTile, DeltaText, DeltaPill } from "@/components/ui/StatTile"
import {
  Badge,
  PositionBadge,
  ClubBadge,
  CaptainBadge,
  StatusDot,
} from "@/components/ui/Badge"
import { Button, Select, SegmentedControl } from "@/components/ui/Button"

/**
 * Temporary design-system review surface (Stage 1).
 * Lets us agree on the visual language before it is applied everywhere.
 */
export default function DesignSystemPage() {
  const [selectValue, setSelectValue] = useState("all")
  const [segment, setSegment] = useState("eps")

  return (
    <div className="animate-rise space-y-10">
      <PageHeader
        eyebrow="Stage 1 · Design review"
        title="Design system"
        description="A working surface for the typography, colour and component language that will be applied across the four sections. Review these before I continue."
      />

      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeader
          title="Typography"
          description="Inter for interface, Instrument Serif for display numerals."
        />
        <Card>
          <CardBody className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="eyebrow mb-2">Display numeral · Instrument Serif</p>
                <p className="display-numeral text-6xl text-ink">2,456</p>
                <p className="mt-2 text-sm text-ink-tertiary">
                  Headline metrics, totals and scores
                </p>
              </div>
              <div>
                <p className="eyebrow mb-2">Interface · Geist</p>
                <p className="text-4xl font-semibold tracking-tight text-ink">
                  67.1
                </p>
                <p className="mt-2 text-sm text-ink-tertiary">
                  Secondary figures and table numerics
                </p>
              </div>
            </div>

            <div className="hairline pt-5">
              <p className="eyebrow mb-3">Typeface pairing</p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-control border border-line bg-surface-subtle/40 px-3 py-2.5">
                  <dt className="eyebrow mb-1">Interface — Geist</dt>
                  <dd className="text-ink-secondary">
                    Vercel&apos;s grotesque. Tight apertures, tall x-height,
                    engineered for dense interfaces at small sizes.
                  </dd>
                </div>
                <div className="rounded-control border border-line bg-surface-subtle/40 px-3 py-2.5">
                  <dt className="eyebrow mb-1">Display — Instrument Serif</dt>
                  <dd className="text-ink-secondary">
                    High-contrast editorial serif. Reserved for numerals
                    and figures, never for running text.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="hairline pt-5">
              <p className="eyebrow mb-3">Scale</p>
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
                <span className="text-2xl font-semibold">Page 30</span>
                <span className="text-xl font-semibold">Section 20</span>
                <span className="text-lg font-semibold">Card 18</span>
                <span className="text-md">Body 15</span>
                <span className="text-base text-ink-secondary">
                  Secondary 14
                </span>
                <span className="text-sm text-ink-secondary">Small 13</span>
                <span className="text-xs text-ink-tertiary">Meta 12</span>
                <span className="eyebrow">Eyebrow 11</span>
              </div>
            </div>

            <div className="hairline pt-5">
              <p className="eyebrow mb-3">Numerals</p>
              <p className="text-sm text-ink-secondary">
                All data figures use{" "}
                <code className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs text-ink">
                  tabular-nums
                </code>{" "}
                so columns align. Compare:{" "}
                <span data-numeric className="text-ink">
                  1111 1111
                </span>{" "}
                vs{" "}
                <span className="text-ink-tertiary">1111 1111</span>
              </p>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeader
          title="Colour"
          description="Restrained by default — green and red are reserved for positive and negative movement only."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Swatch name="Canvas" token="--color-canvas" className="bg-canvas" />
          <Swatch name="Surface" token="--color-surface" className="bg-surface" />
          <Swatch
            name="Ink"
            token="--color-ink"
            className="bg-ink"
            dark
          />
          <Swatch
            name="Positive"
            token="--color-positive"
            className="bg-positive"
            dark
          />
          <Swatch
            name="Negative"
            token="--color-negative"
            className="bg-negative"
            dark
          />
          <Swatch
            name="Caution"
            token="--color-caution"
            className="bg-caution"
            dark
          />
          <Swatch
            name="Line"
            token="--color-line"
            className="bg-line"
          />
          <Swatch
            name="Ink tertiary"
            token="--color-ink-tertiary"
            className="bg-ink-tertiary"
            dark
          />
        </div>

        <Card className="mt-4">
          <CardBody className="flex flex-wrap items-center gap-6">
            <div>
              <p className="eyebrow mb-2">Positive delta</p>
              <DeltaText value={4.2} showIcon />
            </div>
            <div>
              <p className="eyebrow mb-2">Negative delta</p>
              <DeltaText value={-1.8} showIcon />
            </div>
            <div>
              <p className="eyebrow mb-2">Flat</p>
              <DeltaText value={0} showIcon />
            </div>
            <div>
              <p className="eyebrow mb-2">Pills</p>
              <div className="flex gap-2">
                <DeltaPill value={4.2} good flat={false} />
                <DeltaPill value={-1.8} good={false} flat={false} />
                <DeltaPill value={0} good flat />
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeader
          title="Stat tiles"
          description="The primary metric unit. Value in display serif, context beneath."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Overall points"
            value="2,456"
            meta="Season total"
            delta={128}
            deltaLabel="vs last GW"
          />
          <StatTile
            label="Overall rank"
            value="8,923"
            meta="of 11.2m managers"
            delta={-1240}
            deltaLabel="vs last GW"
          />
          <StatTile
            label="Expected points"
            value="67.1"
            meta="Upcoming gameweek"
            icon={<Zap className="h-4 w-4" strokeWidth={1.8} />}
          />
          <StatTile
            label="Money in bank"
            value="£2.5m"
            meta="2 free transfers"
            icon={<Activity className="h-4 w-4" strokeWidth={1.8} />}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeader title="Badges" />
        <Card>
          <CardBody className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Neutral</Badge>
              <Badge tone="positive">+4.2</Badge>
              <Badge tone="negative">-1.8</Badge>
              <Badge tone="caution">Doubtful</Badge>
              <Badge tone="outline">Outline</Badge>
              <Badge tone="inverse">Inverse</Badge>
            </div>

            <div className="hairline flex flex-wrap items-center gap-3 pt-5">
              <PositionBadge position="GK" />
              <PositionBadge position="DEF" />
              <PositionBadge position="MID" />
              <PositionBadge position="FWD" />
            </div>

            <div className="hairline flex flex-wrap items-center gap-3 pt-5">
              <ClubBadge code="LIV" />
              <ClubBadge code="ARS" />
              <ClubBadge code="MCI" />
              <ClubBadge code="CHE" />
            </div>

            <div className="hairline flex flex-wrap items-center gap-3 pt-5">
              <CaptainBadge />
              <CaptainBadge kind="vice" />
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
                <StatusDot status="available" /> Available
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
                <StatusDot status="injured" /> Injured
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
                <StatusDot status="doubtful" /> Doubtful
              </span>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeader title="Controls" />
        <Card>
          <CardBody className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">
                <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                Add to draft
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="secondary" size="sm">
                Small
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>

            <div className="hairline grid gap-5 pt-5 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-2">Select</p>
                <Select
                  value={selectValue}
                  onValueChange={setSelectValue}
                  placeholder="All positions"
                  options={[
                    { value: "all", label: "All positions" },
                    { value: "gk", label: "Goalkeeper" },
                    { value: "def", label: "Defender" },
                    { value: "mid", label: "Midfielder" },
                    { value: "fwd", label: "Forward" },
                  ]}
                />
              </div>
              <div>
                <p className="eyebrow mb-2">Segmented</p>
                <SegmentedControl
                  value={segment}
                  onValueChange={setSegment}
                  options={[
                    { value: "eps", label: "EPS" },
                    { value: "mins", label: "Minutes" },
                    { value: "price", label: "Price" },
                  ]}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* ------------------------------------------------------------ */}
      <section>
        <SectionHeader
          title="Surfaces"
          description="Cards use a hairline border and a whisper of shadow — no heavy elevation."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Card with header"
              description="Optional description beneath the title"
              action={<Badge tone="outline">Action</Badge>}
            />
            <CardBody>
              <p className="text-sm text-ink-secondary">
                Body content sits in a comfortable 20px gutter. Divider
                between header and body uses the same hairline as the card
                border, so the whole thing reads as one object.
              </p>
            </CardBody>
          </Card>

          <Card className="p-5">
            <p className="eyebrow mb-2">Card without header</p>
            <p className="text-md font-semibold text-ink">Compact card</p>
            <p className="mt-1.5 text-sm text-ink-secondary">
              For content that does not warrant a header row.
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}

function Swatch({
  name,
  token,
  className,
}: {
  name: string
  token: string
  className: string
  dark?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className={`h-14 w-full ${className}`} />
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-ink">{name}</p>
        <p className="mt-0.5 font-mono text-2xs text-ink-tertiary">{token}</p>
      </div>
    </div>
  )
}
