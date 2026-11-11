import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-panel border border-line bg-surface shadow-subtle",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line px-5 py-4",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-md font-semibold text-ink">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-ink-tertiary">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-4", className)} {...props}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section heading                                                     */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-6 pb-3",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-ink-tertiary">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page heading                                                        */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string
  description?: ReactNode
  eyebrow?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-base text-ink-secondary">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
