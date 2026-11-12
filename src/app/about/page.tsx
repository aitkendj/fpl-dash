import type { Metadata } from "next"
import {
  GitBranch,
  ExternalLink,
  Database,
  Scale,
  Sparkles,
  Check,
  Circle,
  Rocket,
  Smartphone,
} from "lucide-react"

import { Card, CardHeader, CardBody, PageHeader } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { SQ_ATTRIBUTION } from "@/lib/attribution"

export const metadata: Metadata = {
  title: "About · FPL Analytics",
  description: "What FPL Analytics is, where the data comes from, and what is planned.",
}

const RELEASES = [
  {
    version: "v2.0",
    title: "Live data integration",
    status: "current" as const,
    items: [
      "Connected to the official FPL API for live squad, fixtures and gameweek history",
      "Sideline Quant projections joined on FPL element id, with double-gameweek aggregation",
      "Captured snapshot fallback so the dashboard still works offline",
      "Transfer planner with captaincy promotion and free-transfer allowance",
    ],
  },
  {
    version: "v1.1",
    title: "Design system",
    status: "released" as const,
    items: [
      "Shared component library — tables, stat tiles, badges, cards and charts",
      "Portrait pitch with the bench, matching the FPL app layout",
      "Live and modelled figures visually distinguished throughout",
    ],
  },
  {
    version: "v1.0",
    title: "First build",
    status: "released" as const,
    items: [
      "Team Overview, Expected Points and Transfer Planner",
      "Rank journey and points-by-gameweek charts",
      "Captain and vice-captain selection",
    ],
  },
]

const PLANNED = [
  {
    icon: Smartphone,
    title: "Mobile responsiveness",
    detail:
      "The layout is desktop-first. The sidebar, pitch and data tables need a proper small-screen treatment.",
  },
  {
    icon: Sparkles,
    title: "Sharper projections",
    detail:
      "Blend the model output with FPL's own expected points, and weight start probability more heavily when picking differentials.",
  },
  {
    icon: Scale,
    title: "Fixture difficulty and rolling form",
    detail:
      "Surface fixture difficulty alongside projections, and a rolling six-week form view rather than FPL's four-game form.",
  },
  {
    icon: Rocket,
    title: "Chip planning",
    detail:
      "Model bench strategy around Wildcards and Free Hits, including a rolling bench for three fixtures.",
  },
]

export default function AboutPage() {
  return (
    <div className="animate-rise space-y-8">
      <PageHeader
        eyebrow="FPL Analytics"
        title="About"
        description="A personal Fantasy Premier League analytics dashboard, built for how I like to manage a team."
      />

      {/* What it is */}
      <Card>
        <CardHeader
          title="What this is"
          description="A simplified take on the tools serious FPL managers use."
        />
        <CardBody className="space-y-4 text-base leading-relaxed text-ink-secondary">
          <p>
            FPL Analytics is a personal dashboard for my own Fantasy Premier
            League team. It pulls live data from the official Fantasy Premier
            League API, joins it with published model projections, and presents
            the two side by side so it is always clear which figures are
            actual and which are modelled.
          </p>
          <p>
            It is inspired by products such as{" "}
            <a
              href="https://www.fplcore.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:text-positive"
            >
              FPLCore
            </a>{" "}
            and{" "}
            <a
              href="https://fplcopilot.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:text-positive"
            >
              FPLCopilot
            </a>
            , but deliberately much simpler. Those tools try to be an all-in-one
            replacement for the official game; this one is built around the
            handful of decisions I actually make each week — who starts, who
            captains, and who to swap in.
          </p>
          <p>
            Everything here is a personal project. It is not affiliated with
            the Premier League or the Fantasy Premier League.
          </p>
        </CardBody>
      </Card>

      {/* Source */}
      <Card>
        <CardHeader
          title="Where the data comes from"
          description="No credentials are used or stored — every source is public."
        />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <SourceCard
            icon={<Database className="h-4 w-4" strokeWidth={1.9} />}
            title="Fantasy Premier League API"
            href="https://fantasy.premierleague.com/api/"
            tone="FPL"
            detail="Squad picks, player prices and statistics, clubs, fixtures and gameweek history. Fetched server-side and cached."
          />
          <SourceCard
            icon={<Sparkles className="h-4 w-4" strokeWidth={1.9} />}
            title={SQ_ATTRIBUTION.name}
            href={SQ_ATTRIBUTION.url}
            tone="Model"
            detail="Expected points, expected minutes, start probability and simulated floor and ceiling for every player. Joined to FPL on player id, and aggregated across fixtures for double gameweeks."
            attribution={`${SQ_ATTRIBUTION.licence} · ${SQ_ATTRIBUTION.licenceUrl}`}
          />
        </CardBody>
      </Card>

      {/* GitHub */}
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-ink text-ink-inverse">
              <GitBranch className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-md font-semibold text-ink">Source code</p>
              <p className="mt-0.5 text-sm text-ink-tertiary">
                Built with Next.js, TypeScript and Tailwind CSS.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/aitkendj"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-9 items-center gap-2 rounded-control border border-line-strong bg-surface px-3.5 text-sm font-medium text-ink transition-colors hover:bg-surface-subtle"
          >
            <GitBranch className="h-4 w-4" strokeWidth={1.9} />
            github.com/aitkendj
            <ExternalLink className="h-3 w-3 text-ink-tertiary" strokeWidth={2} />
          </a>
        </CardBody>
      </Card>

      {/* Releases */}
      <Card>
        <CardHeader
          title="Releases"
          description="What has changed, and what is coming next."
        />
        <CardBody className="space-y-6">
          {RELEASES.map((release) => (
            <div key={release.version} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={
                    release.status === "current"
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-ink text-ink-inverse"
                      : "flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-surface text-ink-tertiary"
                  }
                >
                  {release.status === "current" ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    <Circle className="h-1.5 w-1.5 fill-current" strokeWidth={0} />
                  )}
                </span>
                <span className="mt-1 w-px flex-1 bg-line" />
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-md font-semibold text-ink">
                    {release.version}
                  </span>
                  <span className="text-sm text-ink-secondary">
                    {release.title}
                  </span>
                  {release.status === "current" && (
                    <Badge tone="positive">Current</Badge>
                  )}
                </div>
                <ul className="mt-2 space-y-1">
                  {release.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm text-ink-tertiary"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Planned */}
      <Card>
        <CardHeader
          title="Planned"
          description="What I want to work on next."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          {PLANNED.map((item) => (
            <div
              key={item.title}
              className="rounded-card border border-line bg-surface-subtle/40 p-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-control bg-surface text-ink-secondary">
                  <item.icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                </span>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-tertiary">
                {item.detail}
              </p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}

function SourceCard({
  icon,
  title,
  href,
  tone,
  detail,
  attribution,
}: {
  icon: React.ReactNode
  title: string
  href: string
  tone: string
  detail: string
  attribution?: string
}) {
  return (
    <div className="rounded-card border border-line bg-surface-subtle/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-control bg-surface text-ink-secondary">
            {icon}
          </span>
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline decoration-line-strong underline-offset-2 hover:text-positive"
          >
            {title}
            <ExternalLink className="h-3 w-3 text-ink-tertiary" strokeWidth={2} />
          </a>
        </div>
        <Badge tone="outline">{tone}</Badge>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-ink-tertiary">
        {detail}
      </p>
      {attribution && (
        <p className="mt-2 text-2xs text-ink-tertiary">
          Licensed {attribution}
        </p>
      )}
    </div>
  )
}
