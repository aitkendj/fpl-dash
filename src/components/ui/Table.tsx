import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react"
import { ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Shared table primitives.
 *
 * Centralised so column alignment, header styling and sorting behave
 * identically across every table in the dashboard.
 */

export type Align = "left" | "center" | "right"

const ALIGN_CLASS: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

export function Table({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn("w-full text-sm", className)} {...props}>
      {children}
    </table>
  )
}

export function THead({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-line bg-surface-subtle/50", className)}
      {...props}
    >
      {children}
    </thead>
  )
}

export function TBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("divide-y divide-line", className)} {...props}>
      {children}
    </tbody>
  )
}

export function Th({
  children,
  align = "left",
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: Align }) {
  return (
    <th
      scope="col"
      className={cn(
        "py-2 px-3 text-2xs font-semibold uppercase tracking-[0.09em] text-ink-tertiary",
        ALIGN_CLASS[align],
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  align = "left",
  className,
  numeric = false,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
  align?: Align
  /** Applies tabular figures, for columns of numbers */
  numeric?: boolean
}) {
  return (
    <td
      data-numeric={numeric || undefined}
      className={cn(
        "px-3 py-2.5 text-ink-secondary",
        numeric && "tabular-nums",
        ALIGN_CLASS[align],
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

/**
 * A sortable column header.
 */
export function SortableTh({
  children,
  onClick,
  active,
  asc,
  align = "left",
  className,
}: {
  children: ReactNode
  onClick: () => void
  active: boolean
  asc: boolean
  align?: Align
  className?: string
}) {
  return (
    <th
      scope="col"
      className={cn(
        "py-2 px-3 text-2xs font-semibold uppercase tracking-[0.09em]",
        ALIGN_CLASS[align],
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

/**
 * A table row with a hover state.
 */
export function Tr({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-surface-subtle/40",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}
