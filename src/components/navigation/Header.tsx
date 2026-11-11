"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { CalendarClock, RefreshCw, Database } from "lucide-react"
import { NAV_ITEMS, isActivePath } from "./Sidebar"
import { getDashboardData } from "@/data/provider"
import { cn } from "@/lib/utils"

export function DashboardHeader() {
  const pathname = usePathname()
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { currentGameweek } = getDashboardData()

  useEffect(() => {
    const tick = () => setLastUpdated(new Date())
    // Deferred so the first paint happens without a cascading render
    const start = setTimeout(tick, 0)
    const interval = setInterval(tick, 60_000)
    return () => {
      clearTimeout(start)
      clearInterval(interval)
    }
  }, [])

  const current = NAV_ITEMS.find((item) => isActivePath(pathname, item.href))

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-6 border-b border-line bg-canvas/85 px-6 backdrop-blur-md">
      {/* Page context */}
      <div className="min-w-0">
        <p className="eyebrow">Fantasy Premier League</p>
        <p className="mt-0.5 truncate text-md font-semibold tracking-tight text-ink">
          {current?.label ?? "My Team"}
        </p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2">
        <MetaChip icon={<CalendarClock className="h-3.5 w-3.5" strokeWidth={1.9} />}>
          Gameweek {currentGameweek}
        </MetaChip>

        <MetaChip
          icon={<RefreshCw className="h-3.5 w-3.5" strokeWidth={1.9} />}
          title="Last updated"
        >
          {lastUpdated
            ? lastUpdated.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </MetaChip>

        <span className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-control border border-caution/25 bg-caution-wash px-2.5 text-xs font-medium text-caution">
          <Database className="h-3.5 w-3.5" strokeWidth={2} />
          Sample
        </span>
      </div>
    </header>
  )
}

function MetaChip({
  icon,
  children,
  title,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 text-xs font-medium text-ink-secondary"
      )}
    >
      <span className="text-ink-tertiary">{icon}</span>
      {children}
    </span>
  )
}
