import type { ButtonHTMLAttributes, ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md"

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-all duration-150 disabled:pointer-events-none disabled:opacity-40",
        size === "sm" ? "h-7 px-2.5 text-xs" : "h-8.5 px-3 text-sm",
        variant === "primary" &&
          "bg-ink text-ink-inverse hover:bg-ink/90 active:bg-ink shadow-subtle",
        variant === "secondary" &&
          "border border-line-strong bg-surface text-ink hover:bg-surface-subtle active:bg-surface-sunken",
        variant === "ghost" &&
          "text-ink-secondary hover:bg-surface-subtle hover:text-ink",
        variant === "danger" &&
          "border border-negative/25 bg-negative-wash text-negative hover:bg-negative/10",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Select                                                              */
/* ------------------------------------------------------------------ */

export interface SelectOption {
  value: string | number
  label: string
}

export function Select({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  className,
  id,
  ariaLabel,
  disabled = false,
}: {
  options: SelectOption[]
  value: string | number | ""
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  ariaLabel?: string
  disabled?: boolean
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        aria-label={ariaLabel}
        disabled={disabled}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          "h-8.5 w-full appearance-none rounded-control border border-line-strong bg-surface pl-3 pr-8 text-sm text-ink transition-colors focus:border-ink focus:outline-none",
          disabled &&
            "cursor-not-allowed border-line bg-surface-subtle text-ink-tertiary"
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-tertiary"
        strokeWidth={2}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

export function SegmentedControl({
  options,
  value,
  onValueChange,
  className,
}: {
  options: { value: string; label: ReactNode }[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex h-8.5 items-center gap-0.5 rounded-control border border-line bg-surface-subtle p-0.5",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-[0.25rem] px-2.5 text-xs font-medium transition-all duration-150",
              isActive
                ? "bg-surface text-ink shadow-subtle"
                : "text-ink-tertiary hover:text-ink-secondary"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
