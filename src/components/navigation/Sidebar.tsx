"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  Zap,
  ArrowLeftRight,
  Database,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  description: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Team Overview",
    href: "/",
    icon: Users,
    description: "Squad, rank & points",
  },
  {
    label: "Expected Points",
    href: "/expected-points",
    icon: Zap,
    description: "Player projections",
  },
  {
    label: "Transfer Planner",
    href: "/transfer-planner",
    icon: ArrowLeftRight,
    description: "Simulate transfers",
  },
]

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function NavigationSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-line bg-surface"
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <BrandMark />
        <div className="min-w-0">
          <p className="text-md font-semibold leading-none tracking-tight text-ink">
            FPL Analytics
          </p>
          <p className="mt-1 text-2xs font-medium uppercase tracking-[0.09em] text-ink-tertiary">
            Team 6906082
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="eyebrow px-2 pb-2">Analytics</p>
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href)
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-control px-2.5 py-2 transition-colors duration-150",
                    active
                      ? "bg-surface-subtle text-ink"
                      : "text-ink-secondary hover:bg-surface-subtle/60 hover:text-ink"
                  )}
                >
                  {/* Active indicator */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-ink transition-opacity duration-150",
                      active ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-150",
                      active
                        ? "text-ink"
                        : "text-ink-tertiary group-hover:text-ink-secondary"
                    )}
                    strokeWidth={active ? 2.1 : 1.8}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm leading-tight",
                        active ? "font-semibold" : "font-medium"
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-2xs text-ink-tertiary">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-line px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Database className="h-3 w-3 text-caution" strokeWidth={2} />
          <span className="text-2xs font-medium uppercase tracking-[0.09em] text-ink-tertiary">
            Sample data
          </span>
        </div>
        <p className="mt-1.5 text-2xs leading-relaxed text-ink-tertiary">
          Projections are modelled from mock FPL data, not the live API.
        </p>
      </div>
    </aside>
  )
}

/**
 * Geometric mark — an abstracted pitch/bracket form.
 */
function BrandMark() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-ink"
      aria-hidden
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect
          x="1.75"
          y="2.75"
          width="12.5"
          height="10.5"
          rx="1.25"
          stroke="#FAFAF9"
          strokeWidth="1.1"
        />
        <line x1="8" y1="2.75" x2="8" y2="13.25" stroke="#FAFAF9" strokeWidth="1.1" />
        <circle cx="8" cy="8" r="1.85" stroke="#FAFAF9" strokeWidth="1.1" />
      </svg>
    </span>
  )
}
